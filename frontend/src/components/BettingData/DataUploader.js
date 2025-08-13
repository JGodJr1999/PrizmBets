import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Download,
  TrendingUp,
  DollarSign,
  Target,
  BarChart3
} from 'lucide-react';
import toast from 'react-hot-toast';

const UploaderContainer = styled(motion.div)`
  background: ${props => props.theme.colors.background.card};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.xl};
  padding: ${props => props.theme.spacing.xxl};
  max-width: 800px;
  margin: 0 auto;
`;

const Title = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  color: ${props => props.theme.colors.text.primary};
  text-align: center;
  margin-bottom: ${props => props.theme.spacing.md};
`;

const Subtitle = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  text-align: center;
  margin-bottom: ${props => props.theme.spacing.xxl};
  line-height: 1.6;
`;

const SupportedSportsbooks = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.xxl};
`;

const SportsbookCard = styled.div`
  background: ${props => props.theme.colors.background.secondary};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.lg};
  text-align: center;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: ${props => props.theme.colors.accent.primary};
    background: ${props => props.theme.colors.background.hover};
  }
`;

const SportsbookName = styled.div`
  color: ${props => props.theme.colors.text.primary};
  font-weight: 600;
  font-size: 0.9rem;
`;

const DropZone = styled(motion.div)`
  border: 2px dashed ${props => props.isDragActive ? props.theme.colors.accent.primary : props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.xl};
  padding: ${props => props.theme.spacing.xxl};
  text-align: center;
  background: ${props => props.isDragActive ? props.theme.colors.accent.primary + '10' : 'transparent'};
  transition: all 0.3s ease;
  cursor: pointer;
  margin-bottom: ${props => props.theme.spacing.xl};
  
  &:hover {
    border-color: ${props => props.theme.colors.accent.primary};
    background: ${props => props.theme.colors.accent.primary}05;
  }
`;

const UploadIcon = styled(motion.div)`
  color: ${props => props.theme.colors.accent.primary};
  margin-bottom: ${props => props.theme.spacing.lg};
  display: flex;
  justify-content: center;
`;

const DropZoneText = styled.div`
  color: ${props => props.theme.colors.text.primary};
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const DropZoneSubtext = styled.div`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.9rem;
`;

const FileInput = styled.input`
  display: none;
`;

const UploadedFilesList = styled.div`
  margin-top: ${props => props.theme.spacing.xl};
`;

const FileItem = styled(motion.div)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${props => props.theme.spacing.lg};
  background: ${props => props.theme.colors.background.secondary};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  margin-bottom: ${props => props.theme.spacing.md};
`;

const FileInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
`;

const FileName = styled.div`
  color: ${props => props.theme.colors.text.primary};
  font-weight: 500;
`;

const FileSize = styled.div`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.8rem;
`;

const FileStatus = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  color: ${props => {
    switch (props.status) {
      case 'success': return props.theme.colors.accent.success;
      case 'error': return props.theme.colors.accent.secondary;
      case 'processing': return props.theme.colors.accent.warning;
      default: return props.theme.colors.text.secondary;
    }
  }};
`;

const ProcessButton = styled(motion.button)`
  background: ${props => props.theme.colors.gradient.primary};
  color: ${props => props.theme.colors.background.primary};
  border: none;
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.lg} ${props => props.theme.spacing.xl};
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
  margin-top: ${props => props.theme.spacing.xl};
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const StatsPreview = styled(motion.div)`
  background: ${props => props.theme.colors.gradient.card};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.xl};
  padding: ${props => props.theme.spacing.xl};
  margin-top: ${props => props.theme.spacing.xl};
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: ${props => props.theme.spacing.lg};
`;

const StatCard = styled.div`
  text-align: center;
  padding: ${props => props.theme.spacing.lg};
  background: ${props => props.theme.colors.background.card};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
`;

const StatIcon = styled.div`
  color: ${props => props.theme.colors.accent.primary};
  margin-bottom: ${props => props.theme.spacing.sm};
  display: flex;
  justify-content: center;
`;

const StatValue = styled.div`
  font-size: 1.8rem;
  font-weight: 700;
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const StatLabel = styled.div`
  font-size: 0.8rem;
  color: ${props => props.theme.colors.text.secondary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const TemplateSection = styled.div`
  margin-top: ${props => props.theme.spacing.xl};
  padding-top: ${props => props.theme.spacing.xl};
  border-top: 1px solid ${props => props.theme.colors.border.primary};
`;

const TemplateButton = styled(motion.button)`
  background: transparent;
  color: ${props => props.theme.colors.accent.primary};
  border: 2px solid ${props => props.theme.colors.accent.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  margin: 0 auto;
  
  &:hover {
    background: ${props => props.theme.colors.accent.primary};
    color: ${props => props.theme.colors.background.primary};
  }
`;

const DataUploader = ({ onDataUploaded }) => {
  const [files, setFiles] = useState([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const [processedData, setProcessedData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const supportedSportsbooks = [
    'DraftKings', 'FanDuel', 'BetMGM', 'Caesars', 'PointsBet', 
    'Barstool', 'WynnBET', 'BetRivers', 'Unibet', 'ESPN BET'
  ];

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  }, []);

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    addFiles(selectedFiles);
  };

  const addFiles = (newFiles) => {
    const validFiles = newFiles.filter(file => {
      const isValid = file.type === 'text/csv' || 
                     file.type === 'application/vnd.ms-excel' ||
                     file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      if (!isValid) {
        toast.error(`${file.name} is not a supported file type. Please upload CSV or Excel files.`);
      }
      return isValid;
    });

    const filesWithStatus = validFiles.map(file => ({
      file,
      status: 'pending',
      id: Date.now() + Math.random()
    }));

    setFiles(prev => [...prev, ...filesWithStatus]);
  };

  const removeFile = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const processFiles = async () => {
    if (files.length === 0) {
      toast.error('Please upload at least one file');
      return;
    }

    setIsProcessing(true);
    
    // Simulate file processing
    for (let i = 0; i < files.length; i++) {
      setFiles(prev => prev.map(f => 
        f.id === files[i].id ? { ...f, status: 'processing' } : f
      ));
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate success/error (90% success rate)
      const success = Math.random() > 0.1;
      
      setFiles(prev => prev.map(f => 
        f.id === files[i].id ? { ...f, status: success ? 'success' : 'error' } : f
      ));
    }

    // Generate mock processed data
    const mockStats = {
      totalBets: Math.floor(Math.random() * 500) + 100,
      totalWinnings: (Math.random() * 5000 + 1000).toFixed(2),
      winRate: (Math.random() * 30 + 60).toFixed(1),
      avgBetSize: (Math.random() * 100 + 25).toFixed(2)
    };

    setProcessedData(mockStats);
    setIsProcessing(false);
    toast.success('Files processed successfully!');
    
    if (onDataUploaded) {
      onDataUploaded(mockStats);
    }
  };

  const downloadTemplate = () => {
    // Create a simple CSV template
    const csvContent = "Date,Sportsbook,Bet Type,Amount,Odds,Result,Payout\n2024-01-15,DraftKings,Moneyline,25.00,-110,Win,47.73\n2024-01-16,FanDuel,Spread,50.00,+105,Loss,0.00\n";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'betting_data_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Template downloaded!');
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return <CheckCircle size={20} />;
      case 'error': return <XCircle size={20} />;
      case 'processing': return <AlertCircle size={20} />;
      default: return <FileText size={20} />;
    }
  };

  return (
    <UploaderContainer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Title>Upload Your Betting Data</Title>
      <Subtitle>
        Import your betting history from any sportsbook to track all your wins, losses, 
        and statistics in one centralized dashboard.
      </Subtitle>

      <SupportedSportsbooks>
        {supportedSportsbooks.map((sportsbook, index) => (
          <SportsbookCard key={index}>
            <SportsbookName>{sportsbook}</SportsbookName>
          </SportsbookCard>
        ))}
      </SupportedSportsbooks>

      <DropZone
        isDragActive={isDragActive}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input').click()}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <UploadIcon
          animate={isDragActive ? { scale: [1, 1.1, 1] } : { scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Upload size={48} />
        </UploadIcon>
        <DropZoneText>
          {isDragActive ? 'Drop your files here' : 'Drag & drop your betting files here'}
        </DropZoneText>
        <DropZoneSubtext>
          or click to browse • Supports CSV, XLS, XLSX files
        </DropZoneSubtext>
      </DropZone>

      <FileInput
        id="file-input"
        type="file"
        multiple
        accept=".csv,.xls,.xlsx"
        onChange={handleFileSelect}
      />

      <AnimatePresence>
        {files.length > 0 && (
          <UploadedFilesList>
            {files.map((fileItem) => (
              <FileItem
                key={fileItem.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <FileInfo>
                  {getStatusIcon(fileItem.status)}
                  <div>
                    <FileName>{fileItem.file.name}</FileName>
                    <FileSize>{(fileItem.file.size / 1024).toFixed(1)} KB</FileSize>
                  </div>
                </FileInfo>
                <FileStatus status={fileItem.status}>
                  {fileItem.status === 'pending' && 'Ready to process'}
                  {fileItem.status === 'processing' && 'Processing...'}
                  {fileItem.status === 'success' && 'Processed successfully'}
                  {fileItem.status === 'error' && 'Processing failed'}
                </FileStatus>
              </FileItem>
            ))}
          </UploadedFilesList>
        )}
      </AnimatePresence>

      {files.length > 0 && (
        <ProcessButton
          onClick={processFiles}
          disabled={isProcessing}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isProcessing ? 'Processing Files...' : 'Process Uploaded Data'}
        </ProcessButton>
      )}

      <AnimatePresence>
        {processedData && (
          <StatsPreview
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h3 style={{ 
              color: '#ffffff', 
              textAlign: 'center', 
              marginBottom: '1.5rem',
              fontSize: '1.5rem',
              fontWeight: '600'
            }}>
              Processed Data Summary
            </h3>
            <StatsGrid>
              <StatCard>
                <StatIcon><Target size={24} /></StatIcon>
                <StatValue>{processedData.totalBets}</StatValue>
                <StatLabel>Total Bets</StatLabel>
              </StatCard>
              <StatCard>
                <StatIcon><DollarSign size={24} /></StatIcon>
                <StatValue>${processedData.totalWinnings}</StatValue>
                <StatLabel>Total Winnings</StatLabel>
              </StatCard>
              <StatCard>
                <StatIcon><TrendingUp size={24} /></StatIcon>
                <StatValue>{processedData.winRate}%</StatValue>
                <StatLabel>Win Rate</StatLabel>
              </StatCard>
              <StatCard>
                <StatIcon><BarChart3 size={24} /></StatIcon>
                <StatValue>${processedData.avgBetSize}</StatValue>
                <StatLabel>Avg Bet Size</StatLabel>
              </StatCard>
            </StatsGrid>
          </StatsPreview>
        )}
      </AnimatePresence>

      <TemplateSection>
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <h4 style={{ color: '#ffffff', marginBottom: '0.5rem' }}>Need a template?</h4>
          <p style={{ color: '#cccccc', fontSize: '0.9rem' }}>
            Download our CSV template to see the required format for your betting data.
          </p>
        </div>
        <TemplateButton
          onClick={downloadTemplate}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Download size={20} />
          Download Template
        </TemplateButton>
      </TemplateSection>
    </UploaderContainer>
  );
};

export default DataUploader;