import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  query
} from 'firebase/firestore';
import { db } from '../config/firebase';
import toast from 'react-hot-toast';

export const useBetSlip = () => {
  const { user } = useAuth();
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setBets([]);
      setLoading(false);
      return;
    }

    const betSlipRef = collection(db, 'users', user.uid, 'betSlip');
    const q = query(betSlipRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const betData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setBets(betData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching bet slip:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const addBet = async (betData) => {
    if (!user) {
      toast.error('Please sign in to add bets');
      return;
    }

    try {
      const newBetData = {
        ...betData,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: user.uid
      };

      const docRef = doc(collection(db, 'users', user.uid, 'betSlip'));
      await setDoc(docRef, newBetData);

      toast.success('Bet added to slip!');
      return docRef.id;
    } catch (error) {
      console.error('Error adding bet:', error);
      toast.error('Failed to add bet');
      throw error;
    }
  };

  const updateBetStatus = async (betId, status) => {
    if (!user) return;

    try {
      const betRef = doc(db, 'users', user.uid, 'betSlip', betId);
      const updateData = {
        status,
        updatedAt: new Date()
      };

      // If marking as won, calculate profit
      if (status === 'won') {
        const bet = bets.find(b => b.id === betId);
        if (bet) {
          const stake = bet.stake || bet.amount || 0;
          const odds = bet.odds;

          let profit = 0;
          if (typeof odds === 'string') {
            if (odds.startsWith('+')) {
              const oddsValue = parseInt(odds.substring(1));
              profit = (stake * oddsValue) / 100;
            } else if (odds.startsWith('-')) {
              const oddsValue = parseInt(odds.substring(1));
              profit = (stake * 100) / oddsValue;
            }
          }

          updateData.profit = profit;
        }
      }

      await updateDoc(betRef, updateData);

      const statusText = status === 'won' ? 'Won' : status === 'lost' ? 'Lost' : status;
      toast.success(`Bet marked as ${statusText}`);
    } catch (error) {
      console.error('Error updating bet status:', error);
      toast.error('Failed to update bet status');
    }
  };

  const removeBet = async (betId) => {
    if (!user) return;

    try {
      const betRef = doc(db, 'users', user.uid, 'betSlip', betId);
      await deleteDoc(betRef);

      toast.success('Bet removed from slip');
    } catch (error) {
      console.error('Error removing bet:', error);
      toast.error('Failed to remove bet');
    }
  };

  const clearAllBets = async () => {
    if (!user) return;

    try {
      const promises = bets.map(bet => {
        const betRef = doc(db, 'users', user.uid, 'betSlip', bet.id);
        return deleteDoc(betRef);
      });

      await Promise.all(promises);
      toast.success('All bets cleared from slip');
    } catch (error) {
      console.error('Error clearing bets:', error);
      toast.error('Failed to clear bets');
    }
  };

  // Mock data for development/demo purposes
  const addMockBets = async () => {
    const mockBets = [
      {
        title: 'LeBron James Over 27.5 Points',
        sport: 'NBA',
        game: 'Lakers vs Warriors',
        sportsbook: 'DraftKings',
        odds: '+110',
        stake: 50,
        status: 'pending',
        notes: 'Strong matchup against Warriors weak defense'
      },
      {
        title: 'Josh Allen Over 2.5 Passing TDs',
        sport: 'NFL',
        game: 'Bills vs Chiefs',
        sportsbook: 'FanDuel',
        odds: '+125',
        stake: 25,
        status: 'won',
        profit: 31.25
      },
      {
        title: 'Warriors Team Total Over 115.5',
        sport: 'NBA',
        game: 'Warriors vs Lakers',
        sportsbook: 'BetMGM',
        odds: '+100',
        stake: 75,
        status: 'lost'
      }
    ];

    try {
      const promises = mockBets.map(bet => addBet(bet));
      await Promise.all(promises);
      toast.success('Mock bets added for demo!');
    } catch (error) {
      console.error('Error adding mock bets:', error);
    }
  };

  return {
    bets,
    loading,
    addBet,
    updateBetStatus,
    removeBet,
    clearAllBets,
    addMockBets
  };
};