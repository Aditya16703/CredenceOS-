import React, { useEffect, useState, useMemo } from 'react';
import { 
  BarChart3, CheckCircle2, Clock, FileSpreadsheet, RefreshCw, 
  TrendingUp, ArrowUpRight, Download, Search, Filter, Layers, 
  Activity, AlertTriangle, ShieldCheck, ChevronRight, User, 
  Eye, X, Wallet, ArrowDownRight, Building2, Check
} from 'lucide-react';
import { api, handleApiError, handleTokenExpiration } from '../utils/api';

function Reports({ user }) {
  const [recoveredLoans, setRecoveredLoans] = useState([]);
  const [outstandingLoans, setOutstandingLoans] = useState([]);
  const [recoverySummary, setRecoverySummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'recovered', 'outstanding'
  const [refreshing, setRefreshing] = useState(false);
  const [lastSynced, setLastSynced] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('OUTSTANDING_DESC');
  const [selectedLoanDetail, setSelectedLoanDetail] = useState(null);
  const [exportSuccess, setExportSuccess] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    setRefreshing(true);
    setError('');
    
    try {
      const reportData = await api.getRecoveryReport();
      const summary = reportData?.data?.summary || reportData?.summary || null;
      const recovered = reportData?.data?.recoveredLoans || reportData?.recoveredLoans || [];
      const outstanding = reportData?.data?.outstandingLoans || reportData?.outstandingLoans || [];
      
      setRecoverySummary(summary);
      setRecoveredLoans(recovered);
      setOutstandingLoans(outstanding);
      setLastSynced(new Date());
    } catch (err) {
      if (err.status === 401) {
        handleTokenExpiration();
      } else {
        handleApiError(err, setError);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Helper function to format currency
  const formatCurrency = (amount) => {
    const num = parseFloat(amount || 0);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(num);
  };

  // Precise currency formatting for tables & drawers
  const formatPreciseCurrency = (amount) => {
    const num = parseFloat(amount || 0);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // CSV Ledger Exporter
  const handleExportCSV = () => {
    try {
      const combined = [
        ...recoveredLoans.map(l => ({ ...l, bookCategory: 'RECOVERED_CLOSED' })),
        ...outstandingLoans.map(l => ({ ...l, bookCategory: 'ACTIVE_OUTSTANDING' }))
      ];

      if (combined.length === 0) return;

      const headers = [
        'Facility ID',
        'Customer Name',
        'Customer Email',
        'Customer Phone',
        'Assigned Agent',
        'Principal Amount (INR)',
        'Total Due (INR)',
        'Total Recovered (INR)',
        'Net Outstanding (INR)',
        'Facility Status',
        'Recovery Status',
        'Last Settlement Date'
      ];

      const csvRows = [
        headers.join(','),
        ...combined.map(loan => [
          `"${loan.id}"`,
          `"${loan.Customer?.name || 'N/A'}"`,
          `"${loan.Customer?.email || 'N/A'}"`,
          `"${loan.Customer?.phone || 'N/A'}"`,
          `"${loan.Agent?.name || 'N/A'}"`,
          loan.amount || 0,
          loan.totalDue || 0,
          loan.totalPaid || 0,
          loan.outstandingAmount || 0,
          `"${loan.status || ''}"`,
          `"${loan.recoveryStatus || ''}"`,
          `"${loan.lastPaymentDate || loan.updatedAt || ''}"`
        ].join(','))
      ];

      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `CredenceOS_Financial_Recovery_Report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (e) {
      console.error('Export failed:', e);
    }
  };

  // Filtered & Sorted Lists
  const filteredRecoveredLoans = useMemo(() => {
    return recoveredLoans.filter(l => {
      const matchSearch = 
        (l.Customer?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (l.Customer?.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (l.Agent?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(l.id).includes(searchQuery);
      return matchSearch;
    });
  }, [recoveredLoans, searchQuery]);

  const filteredOutstandingLoans = useMemo(() => {
    let result = outstandingLoans.filter(l => {
      const matchSearch = 
        (l.Customer?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (l.Customer?.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (l.Agent?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(l.id).includes(searchQuery);

      const matchStatus = 
        statusFilter === 'ALL' ? true :
        statusFilter === 'PENDING' ? l.recoveryStatus === 'pending' :
        statusFilter === 'IN_PROGRESS' ? (l.recoveryStatus === 'in_progress' || l.recoveryStatus === 'in-progress') : true;

      return matchSearch && matchStatus;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'OUTSTANDING_DESC') return parseFloat(b.outstandingAmount || 0) - parseFloat(a.outstandingAmount || 0);
      if (sortBy === 'OUTSTANDING_ASC') return parseFloat(a.outstandingAmount || 0) - parseFloat(b.outstandingAmount || 0);
      if (sortBy === 'PRINCIPAL_DESC') return parseFloat(b.amount || 0) - parseFloat(a.amount || 0);
      if (sortBy === 'NEWEST') return new Date(b.updatedAt) - new Date(a.updatedAt);
      return 0;
    });

    return result;
  }, [outstandingLoans, searchQuery, statusFilter, sortBy]);

  // Derived Analytics Metrics
  const totalBookExposure = parseFloat(recoverySummary?.totalLoansAmount || 0);
  const totalRecoveredAmount = parseFloat(recoverySummary?.totalRecoveredAmount || 0);
  const totalOutstandingAmount = parseFloat(recoverySummary?.totalOutstandingAmount || 0);
  const rawRecoveryRate = totalBookExposure > 0 ? ((totalRecoveredAmount / totalBookExposure) * 100).toFixed(1) : '0.0';

  if (loading && !recoverySummary) {
    return (
      <div style={{
        background: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid #E2E8F0',
        padding: '4rem 2rem',
        textAlign: 'center',
        boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.05)'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '3px solid #E2E8F0',
          borderTopColor: '#2563EB',
          borderRadius: '50%',
          margin: '0 auto 1.25rem',
          animation: 'spin 0.8s linear infinite'
        }}></div>
        <h3 style={{ fontSize: '1.15rem', color: '#0F172A', fontWeight: 700, marginBottom: '0.35rem' }}>
          Aggregating Portfolio Financial Metrics
        </h3>
        <p style={{ color: '#64748B', fontSize: '0.88rem', margin: 0 }}>
          Querying ledger recovery ratios, outstanding exposures, and NPA surveillance tables...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        background: '#FEF2F2',
        border: '1px solid #FCA5A5',
        borderRadius: '16px',
        padding: '2rem',
        color: '#991B1B'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <AlertTriangle size={24} color="#DC2626" />
          <h4 style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem' }}>Financial Analytics Unavailable</h4>
        </div>
        <p style={{ color: '#B91C1C', fontSize: '0.92rem', marginBottom: '1.25rem' }}>{error}</p>
        <button
          onClick={loadReports}
          style={{
            background: '#DC2626',
            color: '#FFFFFF',
            border: 'none',
            padding: '0.65rem 1.25rem',
            borderRadius: '10px',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.88rem'
          }}
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* 1. Institutional Command Header */}
      <div style={{
        background: '#0B132B',
        borderRadius: '16px',
        padding: '1.75rem 2rem',
        color: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.25rem',
        border: '1px solid #1E293B',
        boxShadow: '0 10px 25px -5px rgba(11, 19, 43, 0.4)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
            <div style={{
              background: 'rgba(37, 99, 235, 0.25)',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              borderRadius: '8px',
              padding: '0.45rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Activity size={20} color="#38BDF8" />
            </div>
            <h2 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
              Financial Intelligence & Asset Recovery
            </h2>
            <span style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#34D399',
              padding: '0.2rem 0.65rem',
              borderRadius: '999px',
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase'
            }}>
              ● Real-Time Ledger Sync
            </span>
          </div>
          <p style={{ margin: 0, color: '#94A3B8', fontSize: '0.88rem' }}>
            NBFC Portfolio Health • PAR Delinquency Tracking • Principal & Interest Capital Recovery
          </p>
        </div>

        {/* Header Action Tools */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={handleExportCSV}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#FFFFFF',
              padding: '0.65rem 1.15rem',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '0.85rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
          >
            {exportSuccess ? <Check size={16} color="#34D399" /> : <Download size={16} color="#94A3B8" />}
            <span>{exportSuccess ? 'Ledger Downloaded' : 'Export Audit CSV'}</span>
          </button>

          <button
            onClick={loadReports}
            disabled={refreshing}
            style={{
              background: '#2563EB',
              border: 'none',
              color: '#FFFFFF',
              padding: '0.65rem 1.25rem',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '0.85rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: refreshing ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => !refreshing && (e.currentTarget.style.background = '#1D4ED8')}
            onMouseLeave={e => !refreshing && (e.currentTarget.style.background = '#2563EB')}
          >
            <RefreshCw size={15} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
            <span>{refreshing ? 'Syncing...' : 'Sync Recovery Data'}</span>
          </button>
        </div>
      </div>

      {/* 2. Executive Capital & Health Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '1.25rem'
      }}>
        {/* Metric 1: Total Loan Book */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          padding: '1.5rem',
          boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.04)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: '#3B82F6' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.04em' }}>
              Gross Book Exposure
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={16} color="#2563EB" />
            </div>
          </div>
          <div className="font-mono-numbers" style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', marginBottom: '0.35rem' }}>
            {formatCurrency(totalBookExposure)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: '#64748B' }}>
            <span style={{ fontWeight: 700, color: '#0F172A' }}>{recoverySummary?.totalLoans || 0}</span>
            <span>Total facilities under servicing</span>
          </div>
        </div>

        {/* Metric 2: Capital Recovered */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          padding: '1.5rem',
          boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.04)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: '#10B981' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.04em' }}>
              Recovered Capital
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={16} color="#059669" />
            </div>
          </div>
          <div className="font-mono-numbers" style={{ fontSize: '1.85rem', fontWeight: 800, color: '#059669', letterSpacing: '-0.02em', marginBottom: '0.35rem' }}>
            {formatCurrency(totalRecoveredAmount)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: '#64748B' }}>
            <span style={{ fontWeight: 700, color: '#059669' }}>{recoveredLoans.length}</span>
            <span>Fully closed & settled facilities</span>
          </div>
        </div>

        {/* Metric 3: Outstanding Portfolio */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          padding: '1.5rem',
          boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.04)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: '#F59E0B' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.04em' }}>
              Outstanding Balance (PAR)
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={16} color="#D97706" />
            </div>
          </div>
          <div className="font-mono-numbers" style={{ fontSize: '1.85rem', fontWeight: 800, color: '#D97706', letterSpacing: '-0.02em', marginBottom: '0.35rem' }}>
            {formatCurrency(totalOutstandingAmount)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: '#64748B' }}>
            <span style={{ fontWeight: 700, color: '#B45309' }}>{outstandingLoans.length}</span>
            <span>Active facilities in recovery cycle</span>
          </div>
        </div>

        {/* Metric 4: Recovery Efficiency Rate */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          padding: '1.5rem',
          boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.04)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: '#06B6D4' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.04em' }}>
              Recovery Efficiency
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ECFEFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={16} color="#0891B2" />
            </div>
          </div>
          <div className="font-mono-numbers" style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', marginBottom: '0.35rem' }}>
            {rawRecoveryRate}%
          </div>
          {/* Visual Mini Progress Bar */}
          <div style={{ width: '100%', height: '6px', background: '#E2E8F0', borderRadius: '999px', overflow: 'hidden', marginTop: '0.65rem' }}>
            <div style={{
              width: `${Math.min(100, Math.max(0, parseFloat(rawRecoveryRate)))}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #10B981 0%, #06B6D4 100%)',
              borderRadius: '999px'
            }} />
          </div>
        </div>
      </div>

      {/* 3. Portfolio Distribution & Surveillance Panels */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
        gap: '1.25rem'
      }}>
        {/* Panel A: Capital Realization Split */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          padding: '1.75rem',
          boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.05rem', fontWeight: 700, color: '#0F172A' }}>
                Capital Deployment vs. Recovery
              </h3>
              <p style={{ margin: 0, color: '#64748B', fontSize: '0.82rem' }}>
                Proportional breakdown of principal recovered vs. outstanding risk exposure
              </p>
            </div>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#2563EB', background: '#EFF6FF', padding: '0.25rem 0.65rem', borderRadius: '6px' }}>
              Asset Split
            </span>
          </div>

          {/* Proportional Stack Bar */}
          <div style={{ width: '100%', height: '28px', background: '#F1F5F9', borderRadius: '8px', overflow: 'hidden', display: 'flex', marginBottom: '1.5rem' }}>
            <div 
              title={`Recovered: ${rawRecoveryRate}%`}
              style={{
                width: `${Math.min(100, Math.max(0, parseFloat(rawRecoveryRate)))}%`,
                height: '100%',
                background: '#10B981',
                transition: 'width 0.6s ease'
              }}
            />
            <div 
              title={`Outstanding: ${(100 - parseFloat(rawRecoveryRate)).toFixed(1)}%`}
              style={{
                width: `${Math.max(0, 100 - parseFloat(rawRecoveryRate))}%`,
                height: '100%',
                background: '#F59E0B',
                transition: 'width 0.6s ease'
              }}
            />
          </div>

          {/* Distribution Data Rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0.85rem', background: '#F8FAFC', borderRadius: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10B981' }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Settled & Recovered Capital</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="font-mono-numbers" style={{ fontSize: '0.92rem', fontWeight: 700, color: '#059669' }}>
                  {formatPreciseCurrency(totalRecoveredAmount)}
                </span>
                <span style={{ fontSize: '0.78rem', color: '#64748B', marginLeft: '0.5rem' }}>({rawRecoveryRate}%)</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0.85rem', background: '#F8FAFC', borderRadius: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#F59E0B' }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Outstanding Balance (PAR)</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="font-mono-numbers" style={{ fontSize: '0.92rem', fontWeight: 700, color: '#D97706' }}>
                  {formatPreciseCurrency(totalOutstandingAmount)}
                </span>
                <span style={{ fontSize: '0.78rem', color: '#64748B', marginLeft: '0.5rem' }}>
                  ({totalBookExposure > 0 ? ((totalOutstandingAmount / totalBookExposure) * 100).toFixed(1) : 0}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Panel B: Asset Quality & Delinquency Bucket Classification */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          padding: '1.75rem',
          boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.05rem', fontWeight: 700, color: '#0F172A' }}>
                Asset Quality & Surveillance Tiers
              </h3>
              <p style={{ margin: 0, color: '#64748B', fontSize: '0.82rem' }}>
                RBI Master Directions asset categorization for NBFC portfolios
              </p>
            </div>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#059669', background: '#ECFDF5', padding: '0.25rem 0.65rem', borderRadius: '6px' }}>
              Prudential Norms
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {/* Standard Assets */}
            <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', padding: '0.75rem 1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>
                  Standard Assets (Recovered & Closed)
                </span>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#059669' }}>
                  {recoveredLoans.length} Facilities
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748B' }}>
                <span>Regular servicing, zero delinquency</span>
                <span className="font-mono-numbers">{formatCurrency(totalRecoveredAmount)}</span>
              </div>
            </div>

            {/* Special Mention Accounts (SMA-1) */}
            <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', padding: '0.75rem 1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>
                  Active Servicing Book (In Progress)
                </span>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#2563EB' }}>
                  {outstandingLoans.filter(l => l.recoveryStatus === 'in_progress' || l.recoveryStatus === 'in-progress').length} Facilities
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748B' }}>
                <span>Scheduled repayments active</span>
                <span className="font-mono-numbers">
                  {formatCurrency(outstandingLoans.filter(l => l.recoveryStatus === 'in_progress' || l.recoveryStatus === 'in-progress').reduce((sum, l) => sum + parseFloat(l.outstandingAmount || 0), 0))}
                </span>
              </div>
            </div>

            {/* Watchlist / Pending Recovery */}
            <div style={{ border: '1px solid #FED7AA', background: '#FFFBF5', borderRadius: '10px', padding: '0.75rem 1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#9A3412' }}>
                  High-Priority Recovery Watchlist (Pending)
                </span>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#C2410C' }}>
                  {outstandingLoans.filter(l => l.recoveryStatus === 'pending').length} Facilities
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#9A3412' }}>
                <span>Escalated to Field Collection Desk</span>
                <span className="font-mono-numbers">
                  {formatCurrency(outstandingLoans.filter(l => l.recoveryStatus === 'pending').reduce((sum, l) => sum + parseFloat(l.outstandingAmount || 0), 0))}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Tab Switcher & Dynamic Filter Toolbar */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid #E2E8F0',
        padding: '1.25rem 1.5rem',
        boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          {/* Tab Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#F1F5F9', padding: '0.35rem', borderRadius: '12px' }}>
            <button
              onClick={() => setActiveTab('overview')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.85rem',
                fontWeight: 700,
                padding: '0.55rem 1.15rem',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: activeTab === 'overview' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'overview' ? '#0F172A' : '#64748B',
                boxShadow: activeTab === 'overview' ? '0 2px 4px rgba(15, 23, 42, 0.08)' : 'none'
              }}
            >
              <BarChart3 size={15} color={activeTab === 'overview' ? '#2563EB' : '#64748B'} />
              <span>Full Portfolio ({recoveredLoans.length + outstandingLoans.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('outstanding')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.85rem',
                fontWeight: 700,
                padding: '0.55rem 1.15rem',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: activeTab === 'outstanding' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'outstanding' ? '#0F172A' : '#64748B',
                boxShadow: activeTab === 'outstanding' ? '0 2px 4px rgba(15, 23, 42, 0.08)' : 'none'
              }}
            >
              <Clock size={15} color={activeTab === 'outstanding' ? '#D97706' : '#64748B'} />
              <span>Outstanding Book ({outstandingLoans.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('recovered')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.85rem',
                fontWeight: 700,
                padding: '0.55rem 1.15rem',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: activeTab === 'recovered' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'recovered' ? '#0F172A' : '#64748B',
                boxShadow: activeTab === 'recovered' ? '0 2px 4px rgba(15, 23, 42, 0.08)' : 'none'
              }}
            >
              <CheckCircle2 size={15} color={activeTab === 'recovered' ? '#059669' : '#64748B'} />
              <span>Recovered & Settled ({recoveredLoans.length})</span>
            </button>
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', minWidth: '280px', flex: '1', maxWidth: '420px' }}>
            <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search by borrower, email, agent, or facility ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem 1rem 0.6rem 2.4rem',
                borderRadius: '10px',
                border: '1px solid #CBD5E1',
                fontSize: '0.85rem',
                outline: 'none',
                boxSizing: 'border-box',
                background: '#F8FAFC'
              }}
              onFocus={e => {
                e.target.style.borderColor = '#2563EB';
                e.target.style.background = '#FFFFFF';
              }}
              onBlur={e => {
                e.target.style.borderColor = '#CBD5E1';
                e.target.style.background = '#F8FAFC';
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94A3B8'
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Secondary Filter Controls */}
        {activeTab !== 'recovered' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', paddingTop: '0.5rem', borderTop: '1px solid #F1F5F9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: '#64748B', fontWeight: 600 }}>
              <Filter size={14} /> Filter Status:
            </div>
            {['ALL', 'PENDING', 'IN_PROGRESS'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: statusFilter === status ? '#2563EB' : '#E2E8F0',
                  background: statusFilter === status ? '#EFF6FF' : '#FFFFFF',
                  color: statusFilter === status ? '#2563EB' : '#475569'
                }}
              >
                {status === 'ALL' ? 'All Recovery Stages' : status === 'PENDING' ? 'Pending Action' : 'In Progress'}
              </button>
            ))}

            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.82rem', color: '#64748B' }}>Sort:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                style={{
                  padding: '0.35rem 0.65rem',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.8rem',
                  color: '#0F172A',
                  fontWeight: 600,
                  background: '#FFFFFF',
                  outline: 'none'
                }}
              >
                <option value="OUTSTANDING_DESC">Highest Outstanding First</option>
                <option value="OUTSTANDING_ASC">Lowest Outstanding First</option>
                <option value="PRINCIPAL_DESC">Highest Principal First</option>
                <option value="NEWEST">Most Recently Updated</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* 5. Institutional Ledger Tables */}

      {/* VIEW: OVERVIEW & OUTSTANDING LOANS */}
      {(activeTab === 'overview' || activeTab === 'outstanding') && (
        <div style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
          boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.04)'
        }}>
          {/* Table Header Ribbon */}
          <div style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#F8FAFC'
          }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>
                Active & Delinquent Recovery Ledger
              </h3>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#64748B' }}>
                Showing {filteredOutstandingLoans.length} accounts with remaining principal or scheduled installments
              </p>
            </div>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>
              Total Outstanding: <strong className="font-mono-numbers" style={{ color: '#D97706' }}>
                {formatCurrency(filteredOutstandingLoans.reduce((sum, l) => sum + parseFloat(l.outstandingAmount || 0), 0))}
              </strong>
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            {filteredOutstandingLoans.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.04em' }}>Facility</th>
                    <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.04em' }}>Borrower Entity</th>
                    <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.04em' }}>Assigned Agent</th>
                    <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.04em', textAlign: 'right' }}>Sanctioned Principal</th>
                    <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.04em', textAlign: 'right' }}>Collected</th>
                    <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.04em', textAlign: 'right' }}>Net Outstanding</th>
                    <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.04em', textAlign: 'center' }}>Recovery Stage</th>
                    <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.04em', textAlign: 'center' }}>Audit Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOutstandingLoans.map((loan, idx) => {
                    const isPending = loan.recoveryStatus === 'pending';
                    const isEven = idx % 2 === 0;
                    return (
                      <tr 
                        key={loan.id}
                        style={{
                          borderBottom: '1px solid #F1F5F9',
                          background: isEven ? '#FFFFFF' : '#FAFAFA',
                          transition: 'background 0.15s ease'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                        onMouseLeave={e => e.currentTarget.style.background = isEven ? '#FFFFFF' : '#FAFAFA'}
                      >
                        {/* Facility ID */}
                        <td style={{ padding: '1rem 1.25rem', verticalAlign: 'middle' }}>
                          <span className="font-mono-numbers" style={{
                            display: 'inline-block',
                            background: '#0B132B',
                            color: '#FFFFFF',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '6px',
                            fontSize: '0.78rem',
                            fontWeight: 700
                          }}>
                            #{loan.id}
                          </span>
                        </td>

                        {/* Customer */}
                        <td style={{ padding: '1rem 1.25rem', verticalAlign: 'middle' }}>
                          <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.88rem' }}>
                            {loan.Customer?.name || 'Unassigned Borrower'}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                            {loan.Customer?.email || 'No email on record'}
                          </div>
                        </td>

                        {/* Agent */}
                        <td style={{ padding: '1rem 1.25rem', verticalAlign: 'middle' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#F1F5F9', padding: '0.25rem 0.65rem', borderRadius: '6px', fontSize: '0.78rem', color: '#334155', fontWeight: 600 }}>
                            <User size={12} color="#64748B" />
                            <span>{loan.Agent?.name || 'Unassigned Desk'}</span>
                          </div>
                        </td>

                        {/* Principal Amount */}
                        <td className="font-mono-numbers" style={{ padding: '1rem 1.25rem', verticalAlign: 'middle', textAlign: 'right', fontWeight: 600, color: '#334155', fontSize: '0.88rem' }}>
                          {formatPreciseCurrency(loan.amount)}
                        </td>

                        {/* Collected Paid */}
                        <td className="font-mono-numbers" style={{ padding: '1rem 1.25rem', verticalAlign: 'middle', textAlign: 'right', fontWeight: 700, color: '#059669', fontSize: '0.88rem' }}>
                          {formatPreciseCurrency(loan.totalPaid)}
                        </td>

                        {/* Outstanding Amount */}
                        <td className="font-mono-numbers" style={{ padding: '1rem 1.25rem', verticalAlign: 'middle', textAlign: 'right', fontWeight: 800, color: '#D97706', fontSize: '0.92rem' }}>
                          {formatPreciseCurrency(loan.outstandingAmount)}
                        </td>

                        {/* Recovery Stage Status */}
                        <td style={{ padding: '1rem 1.25rem', verticalAlign: 'middle', textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '0.25rem 0.65rem',
                            borderRadius: '999px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            letterSpacing: '0.02em',
                            textTransform: 'uppercase',
                            background: isPending ? '#FEF3C7' : '#EFF6FF',
                            color: isPending ? '#B45309' : '#1D4ED8',
                            border: `1px solid ${isPending ? '#FDE68A' : '#BFDBFE'}`
                          }}>
                            {isPending ? '⚠️ Action Required' : '● Servicing Active'}
                          </span>
                        </td>

                        {/* Audit Action Button */}
                        <td style={{ padding: '1rem 1.25rem', verticalAlign: 'middle', textAlign: 'center' }}>
                          <button
                            onClick={() => setSelectedLoanDetail(loan)}
                            style={{
                              background: '#F1F5F9',
                              border: '1px solid #CBD5E1',
                              color: '#334155',
                              padding: '0.35rem 0.75rem',
                              borderRadius: '6px',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem'
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.background = '#0B132B';
                              e.currentTarget.style.color = '#FFFFFF';
                              e.currentTarget.style.borderColor = '#0B132B';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = '#F1F5F9';
                              e.currentTarget.style.color = '#334155';
                              e.currentTarget.style.borderColor = '#CBD5E1';
                            }}
                          >
                            <Eye size={13} />
                            <span>Breakdown</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: '4rem 2rem', textAlign: 'center', color: '#64748B' }}>
                <CheckCircle2 size={40} color="#10B981" style={{ margin: '0 auto 1rem', opacity: 0.8 }} />
                <h4 style={{ margin: '0 0 0.35rem', color: '#0F172A', fontWeight: 700 }}>No Outstanding Facilities Match Filter</h4>
                <p style={{ margin: 0, fontSize: '0.85rem' }}>All loans in this view have zero pending balances or matched criteria.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW: RECOVERED & SETTLED LOANS */}
      {activeTab === 'recovered' && (
        <div style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
          boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.04)'
        }}>
          {/* Table Header Ribbon */}
          <div style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#F0FDF4'
          }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#166534', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={18} color="#16a34a" /> Recovered & Closed Loan Assets
              </h3>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#15803d' }}>
                Showing {filteredRecoveredLoans.length} accounts with 100% principal and interest successfully recovered
              </p>
            </div>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#166534' }}>
              Total Realized Collections: <strong className="font-mono-numbers" style={{ color: '#15803d' }}>
                {formatCurrency(filteredRecoveredLoans.reduce((sum, l) => sum + parseFloat(l.totalPaid || 0), 0))}
              </strong>
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            {filteredRecoveredLoans.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.04em' }}>Facility</th>
                    <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.04em' }}>Borrower Entity</th>
                    <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.04em' }}>Assigned Agent</th>
                    <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.04em', textAlign: 'right' }}>Sanctioned Principal</th>
                    <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.04em', textAlign: 'right' }}>Total Capital Recovered</th>
                    <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.04em', textAlign: 'center' }}>Closure Date</th>
                    <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.04em', textAlign: 'center' }}>Audit Certificate</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecoveredLoans.map((loan, idx) => {
                    const isEven = idx % 2 === 0;
                    return (
                      <tr 
                        key={loan.id}
                        style={{
                          borderBottom: '1px solid #F1F5F9',
                          background: isEven ? '#FFFFFF' : '#FAFAFA',
                          transition: 'background 0.15s ease'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#F0FDF4'}
                        onMouseLeave={e => e.currentTarget.style.background = isEven ? '#FFFFFF' : '#FAFAFA'}
                      >
                        {/* Facility ID */}
                        <td style={{ padding: '1rem 1.25rem', verticalAlign: 'middle' }}>
                          <span className="font-mono-numbers" style={{
                            display: 'inline-block',
                            background: '#064E3B',
                            color: '#FFFFFF',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '6px',
                            fontSize: '0.78rem',
                            fontWeight: 700
                          }}>
                            #{loan.id}
                          </span>
                        </td>

                        {/* Customer */}
                        <td style={{ padding: '1rem 1.25rem', verticalAlign: 'middle' }}>
                          <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.88rem' }}>
                            {loan.Customer?.name || 'N/A'}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                            {loan.Customer?.email || 'N/A'}
                          </div>
                        </td>

                        {/* Agent */}
                        <td style={{ padding: '1rem 1.25rem', verticalAlign: 'middle' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#F1F5F9', padding: '0.25rem 0.65rem', borderRadius: '6px', fontSize: '0.78rem', color: '#334155', fontWeight: 600 }}>
                            <User size={12} color="#64748B" />
                            <span>{loan.Agent?.name || 'Direct Settlement'}</span>
                          </div>
                        </td>

                        {/* Principal Amount */}
                        <td className="font-mono-numbers" style={{ padding: '1rem 1.25rem', verticalAlign: 'middle', textAlign: 'right', fontWeight: 600, color: '#334155', fontSize: '0.88rem' }}>
                          {formatPreciseCurrency(loan.amount)}
                        </td>

                        {/* Recovered Amount */}
                        <td className="font-mono-numbers" style={{ padding: '1rem 1.25rem', verticalAlign: 'middle', textAlign: 'right', fontWeight: 800, color: '#059669', fontSize: '0.92rem' }}>
                          {formatPreciseCurrency(loan.totalPaid)}
                        </td>

                        {/* Date */}
                        <td style={{ padding: '1rem 1.25rem', verticalAlign: 'middle', textAlign: 'center', fontSize: '0.82rem', color: '#64748B' }}>
                          {formatDate(loan.updatedAt)}
                        </td>

                        {/* Action */}
                        <td style={{ padding: '1rem 1.25rem', verticalAlign: 'middle', textAlign: 'center' }}>
                          <button
                            onClick={() => setSelectedLoanDetail(loan)}
                            style={{
                              background: '#ECFDF5',
                              border: '1px solid #A7F3D0',
                              color: '#065F46',
                              padding: '0.35rem 0.75rem',
                              borderRadius: '6px',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem'
                            }}
                          >
                            <ShieldCheck size={14} color="#059669" />
                            <span>Settled (NOC)</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: '4rem 2rem', textAlign: 'center', color: '#64748B' }}>
                <FileSpreadsheet size={40} color="#94A3B8" style={{ margin: '0 auto 1rem', opacity: 0.6 }} />
                <h4 style={{ margin: '0 0 0.35rem', color: '#0F172A', fontWeight: 700 }}>No Recovered Loans Found</h4>
                <p style={{ margin: 0, fontSize: '0.85rem' }}>No loans match the current query in the settled ledger.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. Facility Breakdown Inspector Modal */}
      {selectedLoanDetail && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1.5rem'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '620px',
            boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
            border: '1px solid #E2E8F0',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Modal Header */}
            <div style={{
              background: '#0B132B',
              color: '#FFFFFF',
              padding: '1.25rem 1.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #1E293B'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#38BDF8', textTransform: 'uppercase' }}>
                    Credit Facility Ledger
                  </span>
                  <span style={{ background: '#1E293B', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', color: '#94A3B8' }}>
                    #{selectedLoanDetail.id}
                  </span>
                </div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#FFFFFF' }}>
                  {selectedLoanDetail.Customer?.name || 'Borrower Account'}
                </h3>
              </div>
              <button
                onClick={() => setSelectedLoanDetail(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '8px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#94A3B8',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Financial Metrics Strip */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.75rem',
                background: '#F8FAFC',
                padding: '1rem',
                borderRadius: '12px',
                border: '1px solid #E2E8F0'
              }}>
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Sanctioned Principal</div>
                  <div className="font-mono-numbers" style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', marginTop: '0.2rem' }}>
                    {formatPreciseCurrency(selectedLoanDetail.amount)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Paid</div>
                  <div className="font-mono-numbers" style={{ fontSize: '1.1rem', fontWeight: 800, color: '#059669', marginTop: '0.2rem' }}>
                    {formatPreciseCurrency(selectedLoanDetail.totalPaid)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Balance Due</div>
                  <div className="font-mono-numbers" style={{ fontSize: '1.1rem', fontWeight: 800, color: '#D97706', marginTop: '0.2rem' }}>
                    {formatPreciseCurrency(selectedLoanDetail.outstandingAmount || 0)}
                  </div>
                </div>
              </div>

              {/* Detailed Specs List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid #F1F5F9', fontSize: '0.85rem' }}>
                  <span style={{ color: '#64748B' }}>Borrower Email</span>
                  <span style={{ fontWeight: 600, color: '#0F172A' }}>{selectedLoanDetail.Customer?.email || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid #F1F5F9', fontSize: '0.85rem' }}>
                  <span style={{ color: '#64748B' }}>Borrower Contact</span>
                  <span style={{ fontWeight: 600, color: '#0F172A' }}>{selectedLoanDetail.Customer?.phone || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid #F1F5F9', fontSize: '0.85rem' }}>
                  <span style={{ color: '#64748B' }}>Assigned Portfolio Officer</span>
                  <span style={{ fontWeight: 600, color: '#0F172A' }}>{selectedLoanDetail.Agent?.name || 'Direct Underwriting Desk'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid #F1F5F9', fontSize: '0.85rem' }}>
                  <span style={{ color: '#64748B' }}>Installment Count Recorded</span>
                  <span style={{ fontWeight: 700, color: '#0F172A' }}>{selectedLoanDetail.paymentCount || 0} Transactions</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid #F1F5F9', fontSize: '0.85rem' }}>
                  <span style={{ color: '#64748B' }}>Calculated Monthly EMI</span>
                  <span className="font-mono-numbers" style={{ fontWeight: 700, color: '#0F172A' }}>{formatPreciseCurrency(selectedLoanDetail.emi)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid #F1F5F9', fontSize: '0.85rem' }}>
                  <span style={{ color: '#64748B' }}>Last Payment Date</span>
                  <span style={{ fontWeight: 600, color: '#0F172A' }}>{formatDate(selectedLoanDetail.lastPaymentDate)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', fontSize: '0.85rem' }}>
                  <span style={{ color: '#64748B' }}>Facility Status</span>
                  <span style={{
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    color: selectedLoanDetail.status === 'CLOSED' ? '#059669' : '#2563EB'
                  }}>
                    {selectedLoanDetail.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              background: '#F8FAFC',
              padding: '1rem 1.75rem',
              display: 'flex',
              justifyContent: 'flex-end',
              borderTop: '1px solid #E2E8F0'
            }}>
              <button
                onClick={() => setSelectedLoanDetail(null)}
                style={{
                  background: '#0B132B',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '0.55rem 1.25rem',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Reports;

