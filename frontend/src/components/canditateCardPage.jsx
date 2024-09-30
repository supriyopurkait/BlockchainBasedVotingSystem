import React, { useState, useEffect } from 'react';
import UserCard from '@/components/candidateCard';
import { fetchCandidate } from '@/utils/getDetails';
import { ethers } from 'ethers';
import Message from './AfterVoteMessage';  // Import the Message component

const UserCardsPage = ({ wallet, VotingSystemContractAddress, VotingSystemABI }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAftervoteMessage, setShowAftervoteMessage] = useState(false);
  const [messageData, setMessageData] = useState('');  // For storing dynamic message content

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        const fetchedUsers = await fetchCandidate(wallet);
        console.error('Fetched users:', fetchedUsers);
        setUsers(fetchedUsers);
      } catch (err) {
        setError('Failed to load users. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (wallet) {
      loadUsers();
    }
  }, [wallet]);

  const handleVote = async (candidateId) => {
    try {
      const RELAYER_URL = 'http://127.0.0.1:5000/api';
      console.log('Voting for user:', candidateId);
      const { provider, signer } = wallet;
      const address = await signer.getAddress();
      console.log('Wallet address:', address);
      console.log('VotingSystemContractAddress:', VotingSystemContractAddress);

      if (!VotingSystemContractAddress || !VotingSystemABI || !provider || !signer) {
        console.error('Invalid contract address, ABI, or wallet provider/signers.');
        return;
      }

      const contract = new ethers.Contract(VotingSystemContractAddress, VotingSystemABI, signer);

      const nonce = await contract.nonces(address);
      const functionSignature = contract.interface.encodeFunctionData('vote', [candidateId]);

      const messageHash = ethers.solidityPackedKeccak256(
        ['address', 'uint256', 'bytes'],
        [address, nonce, functionSignature]
      );
      const messageHashBinary = ethers.getBytes(messageHash);
      const signature = await signer.signMessage(messageHashBinary);

      const { r, s, v } = ethers.Signature.from(signature);
      console.log('Signature:', { r, s, v });
      const response = await fetch(`${RELAYER_URL}/execute-meta-tx`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userAddress: address, functionSignature, r, s, v })
      });
      const data = await response.json();

      console.log('Response data:', data);

      if (data.status === 'success') {
        console.log("Voted successfully for user:", candidateId, "\ntxHash:", data.txHash);
        setMessageData(`Congratulations! You successfully voted. Transaction Hash: ${data.txHash}`);
        setShowAftervoteMessage(true);
      } else if ((data.status === 'error') && (data.message === 'You have already voted')) {
        console.log("Vote unsuccessful for user:", candidateId, "\n", data.message);
        setMessageData('You have already voted.');
        setShowAftervoteMessage(true);
      } else {
        console.error("Error in voting:", data.error);
        setMessageData('An error occurred while voting. Please try again.');
        setShowAftervoteMessage(true);
      }

    } catch (error) {
      console.error('Error in handleVote:', error.message);
      console.error('Full error object:', error);
      setMessageData('An unexpected error occurred. Please try again later.');
      setShowAftervoteMessage(true);
    }
  };


  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="container">
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-8 text-center">Vote for Your Favorite User</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {users.map(user => (
            <UserCard key={user.candidate_id} user={user} onVote={handleVote} />
          ))}
        </div>
      </div>
      {showAftervoteMessage && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <Message data={messageData} onClose={() => setShowAftervoteMessage(false)} />
        </div>
      )}
    </div>
  );
};

export default UserCardsPage;
