import React, { useState } from 'react';
import styled from 'styled-components';
import { Users, Crown, User, Mail, Calendar, Trophy, MoreVertical, UserX, MessageSquare, Award } from 'lucide-react';
import toast from 'react-hot-toast';

const MembersContainer = styled.div`
  background: ${props => props.theme.colors.background.card};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  overflow: hidden;
`;

const MembersHeader = styled.div`
  background: ${props => props.theme.colors.background.secondary};
  border-bottom: 1px solid ${props => props.theme.colors.border.primary};
  padding: ${props => props.theme.spacing.lg};
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    flex-direction: column;
    align-items: stretch;
    gap: ${props => props.theme.spacing.md};
  }
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const Title = styled.h3`
  color: ${props => props.theme.colors.text.primary};
  font-size: 1.3rem;
  font-weight: 600;
  margin: 0;
`;

const MemberCount = styled.span`
  background: ${props => props.theme.colors.accent.primary};
  color: ${props => props.theme.colors.background.primary};
  padding: 4px 8px;
  border-radius: ${props => props.theme.borderRadius.sm};
  font-size: 0.8rem;
  font-weight: 600;
`;

const SearchBar = styled.input`
  background: ${props => props.theme.colors.background.primary};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  color: ${props => props.theme.colors.text.primary};
  font-size: 0.9rem;
  width: 250px;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.accent.primary};
  }
  
  &::placeholder {
    color: ${props => props.theme.colors.text.muted};
  }
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    width: 100%;
  }
`;

const MembersList = styled.div`
  max-height: 600px;
  overflow-y: auto;
`;

const MemberRow = styled.div`
  display: grid;
  grid-template-columns: 1fr auto auto auto auto;
  gap: ${props => props.theme.spacing.md};
  padding: ${props => props.theme.spacing.lg};
  border-bottom: 1px solid ${props => props.theme.colors.border.secondary};
  align-items: center;
  transition: background-color 0.2s ease;
  
  &:hover {
    background: ${props => props.theme.colors.background.hover};
  }
  
  &:last-child {
    border-bottom: none;
  }
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    grid-template-columns: 1fr auto;
    gap: ${props => props.theme.spacing.sm};
    padding: ${props => props.theme.spacing.md};
  }
`;

const MemberInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const Avatar = styled.div`
  width: 40px;
  height: 40px;
  background: ${props => props.isOwner ? 
    `linear-gradient(135deg, ${props.theme.colors.accent.primary}, ${props.theme.colors.accent.primary}dd)` :
    props.theme.colors.background.tertiary};
  border-radius: ${props => props.theme.borderRadius.full};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.isOwner ? props.theme.colors.background.primary : props.theme.colors.text.secondary};
  font-weight: 600;
  font-size: 1.1rem;
`;

const MemberDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xs};
`;

const MemberName = styled.div`
  color: ${props => props.theme.colors.text.primary};
  font-weight: 600;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
`;

const MemberEmail = styled.div`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.85rem;
`;

const StatBadge = styled.div`
  background: ${props => props.theme.colors.background.tertiary};
  border: 1px solid ${props => props.theme.colors.border.secondary};
  border-radius: ${props => props.theme.borderRadius.sm};
  padding: 4px 8px;
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.8rem;
  font-weight: 500;
  text-align: center;
  min-width: 60px;
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    display: none;
  }
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.colors.text.secondary};
  cursor: pointer;
  padding: ${props => props.theme.spacing.xs};
  border-radius: ${props => props.theme.borderRadius.sm};
  transition: all 0.2s ease;
  
  &:hover {
    color: ${props => props.theme.colors.text.primary};
    background: ${props => props.theme.colors.background.secondary};
  }
`;

const RoleBadge = styled.div`
  background: ${props => props.isOwner ? props.theme.colors.accent.primary : props.theme.colors.background.secondary};
  color: ${props => props.isOwner ? props.theme.colors.background.primary : props.theme.colors.text.secondary};
  padding: 2px 6px;
  border-radius: ${props => props.theme.borderRadius.sm};
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 2px;
`;

const MobileStats = styled.div`
  display: none;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xs};
  margin-top: ${props => props.theme.spacing.sm};
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    display: flex;
  }
`;

const MobileStatRow = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: ${props => props.theme.colors.text.secondary};
`;

const MemberManagement = ({ pool }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Mock member data for demo
  const members = [
    {
      id: 1,
      name: 'John Smith',
      email: 'john.smith@email.com',
      role: 'admin',
      joined_date: '2024-08-01',
      total_picks: 40,
      correct_picks: 28,
      win_percentage: 70,
      current_streak: 3
    },
    {
      id: 2,
      name: 'Sarah Johnson',
      email: 'sarah.j@email.com',
      role: 'member',
      joined_date: '2024-08-02',
      total_picks: 40,
      correct_picks: 26,
      win_percentage: 65,
      current_streak: -1
    },
    {
      id: 3,
      name: 'Mike Davis',
      email: 'mike.davis@email.com',
      role: 'member',
      joined_date: '2024-08-03',
      total_picks: 38,
      correct_picks: 24,
      win_percentage: 63,
      current_streak: 2
    },
    {
      id: 4,
      name: 'Emily Wilson',
      email: 'emily.w@email.com',
      role: 'member',
      joined_date: '2024-08-05',
      total_picks: 35,
      correct_picks: 22,
      win_percentage: 63,
      current_streak: 1
    },
    {
      id: 5,
      name: 'Chris Brown',
      email: 'chris.brown@email.com',
      role: 'member',
      joined_date: '2024-08-07',
      total_picks: 32,
      correct_picks: 18,
      win_percentage: 56,
      current_streak: -2
    }
  ];

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRemoveMember = (memberId, memberName) => {
    if (window.confirm(`Are you sure you want to remove ${memberName} from the pool?`)) {
      toast.success(`${memberName} has been removed from the pool`);
    }
  };

  const handleSendMessage = (memberName) => {
    toast.success(`Opening message composer for ${memberName}`);
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <MembersContainer>
      <MembersHeader>
        <HeaderLeft>
          <Title>Pool Members</Title>
          <MemberCount>{filteredMembers.length}</MemberCount>
        </HeaderLeft>
        <SearchBar
          type="text"
          placeholder="Search members..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </MembersHeader>

      <MembersList>
        {filteredMembers.map(member => (
          <MemberRow key={member.id}>
            <MemberInfo>
              <Avatar isOwner={member.role === 'admin'}>
                {member.role === 'admin' ? <Crown size={20} /> : getInitials(member.name)}
              </Avatar>
              <MemberDetails>
                <MemberName>
                  {member.name}
                  <RoleBadge isOwner={member.role === 'admin'}>
                    {member.role === 'admin' ? <Crown size={10} /> : <User size={10} />}
                    {member.role === 'admin' ? 'Owner' : 'Member'}
                  </RoleBadge>
                </MemberName>
                <MemberEmail>{member.email}</MemberEmail>
                <MobileStats>
                  <MobileStatRow>
                    <span>Picks:</span>
                    <span>{member.correct_picks}/{member.total_picks}</span>
                  </MobileStatRow>
                  <MobileStatRow>
                    <span>Win Rate:</span>
                    <span>{member.win_percentage}%</span>
                  </MobileStatRow>
                  <MobileStatRow>
                    <span>Joined:</span>
                    <span>{formatDate(member.joined_date)}</span>
                  </MobileStatRow>
                </MobileStats>
              </MemberDetails>
            </MemberInfo>
            
            <StatBadge>
              {member.correct_picks}/{member.total_picks}
            </StatBadge>
            
            <StatBadge>
              {member.win_percentage}%
            </StatBadge>
            
            <StatBadge>
              {member.current_streak > 0 ? `W${member.current_streak}` : 
               member.current_streak < 0 ? `L${Math.abs(member.current_streak)}` : '-'}
            </StatBadge>
            
            <div style={{ display: 'flex', gap: '4px' }}>
              <ActionButton onClick={() => handleSendMessage(member.name)} title="Send Message">
                <MessageSquare size={16} />
              </ActionButton>
              {member.role !== 'admin' && (
                <ActionButton 
                  onClick={() => handleRemoveMember(member.id, member.name)} 
                  title="Remove Member"
                  style={{ color: '#ef4444' }}
                >
                  <UserX size={16} />
                </ActionButton>
              )}
            </div>
          </MemberRow>
        ))}
      </MembersList>
    </MembersContainer>
  );
};

export default MemberManagement;