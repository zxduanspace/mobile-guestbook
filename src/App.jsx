import { useState, useEffect } from 'react'
import { createWeb3Modal, defaultConfig, useWeb3ModalProvider, useWeb3ModalAccount } from '@web3modal/ethers/react'
import { BrowserProvider, Contract } from 'ethers'

// 1. Web3Modal Configuration
const projectId = '7b5db0dc3f598b2b86eaced066d63bfd' // Replace with your WalletConnect Project ID

const sepolia = {
  chainId: 11155111,
  name: 'Sepolia',
  currency: 'ETH',
  explorerUrl: 'https://sepolia.etherscan.io',
  rpcUrl: 'https://rpc.sepolia.org'
}

const metadata = {
  name: 'Mobile Guestbook',
  description: 'A decentralized guestbook for mobile',
  url: 'https://localhost:5173', 
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

const ethersConfig = defaultConfig({
  metadata,
  enableEIP6963: true,
  enableInjected: true,
  enableCoinbase: true,
})

createWeb3Modal({
  ethersConfig,
  chains: [sepolia],
  projectId,
})

// 2. Smart Contract Details
const CONTRACT_ADDRESS = "0xaede622144E59FDFe360D99fF27408CA17D8108A"; // Replace with your contract address
const CONTRACT_ABI = [
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "sender",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "text",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "MessageLeft",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "getAllMessages",
    "outputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "sender",
            "type": "address"
          },
          {
            "internalType": "string",
            "name": "text",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "timestamp",
            "type": "uint256"
          }
        ],
        "internalType": "struct Guestbook.Message[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_text",
        "type": "string"
      }
    ],
    "name": "leaveMessage",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "messages",
    "outputs": [
      {
        "internalType": "address",
        "name": "sender",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "text",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
]; // Replace with your ABI array

export default function App() {
  const { address, isConnected } = useWeb3ModalAccount()
  const { walletProvider } = useWeb3ModalProvider()
  
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Fetch messages from the smart contract
  const fetchMessages = async () => {
    if (!isConnected) return;
    try {
      const provider = new BrowserProvider(walletProvider)
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider)
      const data = await contract.getAllMessages()
      setMessages(data)
    } catch (error) {
      console.error("Error fetching messages:", error)
    }
  }

  useEffect(() => {
    fetchMessages()
  }, [isConnected])

  // Send a new message
  const sendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage) return
    setIsLoading(true)
    
    try {
      const provider = new BrowserProvider(walletProvider)
      const signer = await provider.getSigner()
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
      
      const tx = await contract.leaveMessage(newMessage)
      await tx.wait() // Wait for transaction to finish
      
      setNewMessage("")
      fetchMessages() // Refresh list
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 font-sans">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl p-6 mt-10">
        
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Decentralized Guestbook
        </h1>
        
        {/* Wallet Connect Button - This automatically handles Mobile/Desktop UI */}
        <div className="flex justify-center mb-8">
          <w3m-button />
        </div>

        {isConnected ? (
          <div>
            <form onSubmit={sendMessage} className="mb-6">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Leave a message..."
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                {isLoading ? "Sending..." : "Submit Message"}
              </button>
            </form>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-700">Recent Messages:</h2>
              {messages.map((msg, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-sm overflow-hidden">
                  <p className="font-mono text-xs text-gray-500 truncate mb-1">
                    From: {msg.sender}
                  </p>
                  <p className="text-gray-800">{msg.text}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-500">
            Please connect your wallet to view and leave messages.
          </p>
        )}
      </div>
    </div>
  )
}