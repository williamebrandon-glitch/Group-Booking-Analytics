import React, { useState, useCallback, useMemo } from ‘react’;
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from ‘recharts’;
import { Upload, TrendingUp, TrendingDown, Calendar, Users, DollarSign, Clock, Building2, Target, RefreshCw, AlertCircle, X, BarChart3, ChevronLeft, User, ChevronRight, Eye, EyeOff } from ‘lucide-react’;
import Papa from ‘papaparse’;

const COLORS = {
primary: ‘#0066FF’,
secondary: ‘#00C2FF’,
accent: ‘#6366F1’,
success: ‘#10B981’,
warning: ‘#F59E0B’,
danger: ‘#EF4444’,
neutral: ‘#64748B’,
muted: ‘#94A3B8’,
corporate: ‘#0066FF’,
social: ‘#EC4899’,
group: ‘#0066FF’,
catering: ‘#10B981’,
fnb: ‘#F59E0B’,
rental: ‘#6366F1’,
chartColors: [’#0066FF’, ‘#10B981’, ‘#F59E0B’, ‘#EF4444’, ‘#6366F1’, ‘#EC4899’, ‘#00C2FF’, ‘#14B8A6’, ‘#8B5CF6’, ‘#F97316’],
yearColors: { 2022: ‘#94A3B8’, 2023: ‘#64748B’, 2024: ‘#6366F1’, 2025: ‘#0066FF’, 2026: ‘#10B981’, 2027: ‘#F59E0B’ }
};

const MONTH_NAMES = [‘Jan’, ‘Feb’, ‘Mar’, ‘Apr’, ‘May’, ‘Jun’, ‘Jul’, ‘Aug’, ‘Sep’, ‘Oct’, ‘Nov’, ‘Dec’];

// Only show these managers
const ALLOWED_MANAGERS = [‘Whitney Britton’, ‘Anna Lawless’];

const formatCurrency = (value) => {
if (!value || isNaN(value)) return ‘$0’;
if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
return `$${value.toFixed(0)}`;
};

const formatNumber = (value) => {
if (!value || isNaN(value)) return ‘0’;
if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
return Math.round(value).toString();
};

const parseNum = (val) => {
if (!val) return 0;
const cleaned = String(val).replace(/[,$]/g, ‘’);
const num = parseFloat(cleaned);
return isNaN(num) ? 0 : num;
};

const formatMonthLabel = (monthStr) => {
if (!monthStr) return ‘’;
const [year, month] = monthStr.split(’-’);
return `${MONTH_NAMES[parseInt(month) - 1]} ${year.slice(2)}`;
};

const getSegmentCategory = (segment) => {
const s = (segment || ‘’).toLowerCase().trim();
if ([‘smerf’, ‘social’].includes(s)) return ‘Social’;
return ‘Corporate’;
};

const getBookingCategory = (bookingType) => {
const t = (bookingType || ‘’).toLowerCase().trim();
if (t.includes(‘event’)) return ‘Local Catering’;
return ‘Group Sales’;
};

const LOST_REASON_THEMES = {
‘Price’: [‘rate’, ‘price’, ‘expensive’, ‘cost’, ‘budget’, ‘pricing’, ‘cheaper’, ‘afford’, ‘fee’, ‘charge’, ‘costly’],
‘Availability’: [‘available’, ‘availability’, ‘sold out’, ‘no rooms’, ‘full’, ‘capacity’, ‘dates’, ‘booked’, ‘space’],
‘Location’: [‘location’, ‘distance’, ‘far’, ‘travel’, ‘drive’, ‘competitor’, ‘another property’, ‘different hotel’, ‘went elsewhere’, ‘chose another’, ‘alternate’, ‘destination’]
};

const categorizeLostReason = (reason) => {
const r = (reason || ‘’).toLowerCase();
for (const [theme, keywords] of Object.entries(LOST_REASON_THEMES)) {
if (keywords.some(kw => r.includes(kw))) {
return theme;
}
}
return reason; // Return original if no theme matches
};

// Lost reason keywords for thematic analysis
const LOST_REASON_KEYWORDS = {
‘Rate Too High’: [‘rate’, ‘price’, ‘expensive’, ‘cost’, ‘budget’, ‘pricing’, ‘cheaper’, ‘afford’],
‘Availability’: [‘available’, ‘availability’, ‘sold out’, ‘no rooms’, ‘full’, ‘capacity’, ‘dates’],
‘Competition’: [‘competitor’, ‘another property’, ‘different hotel’, ‘went elsewhere’, ‘chose another’],
‘Event Cancelled’: [‘cancel’, ‘cancelled’, ‘postpone’, ‘postponed’, ‘reschedule’],
‘No Response’: [‘no response’, ‘unresponsive’, ‘didn't respond’, ‘never heard’, ‘ghost’],
‘Location’: [‘location’, ‘distance’, ‘far’, ‘travel’, ‘drive’],
‘Group Size’: [‘size’, ‘too small’, ‘too large’, ‘minimum’, ‘maximum’],
‘Timing’: [‘timing’, ‘too soon’, ‘too late’, ‘short notice’, ‘lead time’]
};

const analyzeCommentThemes = (bookings) => {
const themes = {};
const unthemed = [];
bookings.forEach(b => {
const comment = (b.terminalReason || ‘’).toLowerCase();
let foundTheme = false;
for (const [theme, keywords] of Object.entries(LOST_REASON_KEYWORDS)) {
if (keywords.some(kw => comment.includes(kw))) {
if (!themes[theme]) themes[theme] = { theme, count: 0, bookings: [] };
themes[theme].count++;
themes[theme].bookings.push(b);
foundTheme = true;
break;
}
}
if (!foundTheme) unthemed.push(b);
});
return { themes: Object.values(themes).sort((a, b) => b.count - a.count), unthemed };
};

// Toggle Button Component
const ToggleButton = ({ label, active, onClick, color }) => (
<button
className={`toggle-btn ${active ? 'active' : ''}`}
onClick={onClick}
style={active ? { background: color || COLORS.primary, borderColor: color || COLORS.primary } : {}}

```
{label}
```

  </button>
);

// Year Toggle Group
const YearToggles = ({ years, selected, onChange, small = false }) => (

  <div className={`toggle-group ${small ? 'small' : ''}`}>
    {years.map(year => (
      <ToggleButton
        key={year}
        label={year}
        active={selected.includes(year)}
        onClick={() => {
          if (selected.includes(year)) {
            onChange(selected.filter(y => y !== year));
          } else {
            onChange([...selected, year].sort());
          }
        }}
        color={COLORS.yearColors[year] || COLORS.primary}
      />
    ))}
  </div>
);

// Grade Toggle Group  
const GradeToggles = ({ grades, selected, onChange, small = false }) => (

  <div className={`toggle-group ${small ? 'small' : ''}`}>
    {grades.map(grade => (
      <ToggleButton
        key={grade}
        label={grade.replace('Grade ', 'G')}
        active={selected.includes(grade)}
        onClick={() => {
          if (selected.includes(grade)) {
            onChange(selected.filter(g => g !== grade));
          } else {
            onChange([...selected, grade]);
          }
        }}
      />
    ))}
  </div>
);

// Segment Toggle (Corporate/Social/All)
const SegmentToggle = ({ selected, onChange }) => (

  <div className="toggle-group small">
    <ToggleButton label="All" active={selected === 'all'} onClick={() => onChange('all')} />
    <ToggleButton label="Corporate" active={selected === 'Corporate'} onClick={() => onChange('Corporate')} color={COLORS.corporate} />
    <ToggleButton label="Social" active={selected === 'Social'} onClick={() => onChange('Social')} color={COLORS.social} />
  </div>
);

// Widget Header with Local Filters
const WidgetHeader = ({ title, subtitle, years, selectedYears, onYearChange, grades, selectedGrades, onGradeChange, segment, onSegmentChange, showYears = true, showGrades = false, showSegment = false }) => (

  <div className="widget-header">
    <div className="widget-title-row">
      <div>
        <h3 className="chart-title">{title}</h3>
        {subtitle && <span className="chart-subtitle">{subtitle}</span>}
      </div>
      <div className="widget-filters">
        {showSegment && <SegmentToggle selected={segment} onChange={onSegmentChange} />}
        {showYears && years && years.length > 0 && (
          <YearToggles years={years} selected={selectedYears || []} onChange={onYearChange} small />
        )}
        {showGrades && grades && grades.length > 0 && (
          <GradeToggles grades={grades} selected={selectedGrades || []} onChange={onGradeChange} small />
        )}
      </div>
    </div>
  </div>
);

// Clickable KPI Card with YoY variance
const KPICard = ({ title, value, subtitle, icon: Icon, onClick, clickable = false, yoyVariance = null }) => (

  <div className={`kpi-card ${clickable ? 'clickable' : ''}`} onClick={clickable ? onClick : undefined}>
    <div className="kpi-header">
      <span className="kpi-title">{title}</span>
      <div className="kpi-icon-wrapper"><Icon size={18} /></div>
    </div>
    <div className="kpi-value">{value}</div>
    {subtitle && <div className="kpi-subtitle">{subtitle}</div>}
    {yoyVariance !== null && (
      <div className={`yoy-variance ${yoyVariance > 0 ? 'positive' : yoyVariance < 0 ? 'negative' : 'neutral'}`}>
        {yoyVariance > 0 ? <TrendingUp size={10} /> : yoyVariance < 0 ? <TrendingDown size={10} /> : null}
        {yoyVariance > 0 ? '+' : ''}{yoyVariance}% vs PY
      </div>
    )}
    {clickable && <div className="kpi-click-hint">Click for details <ChevronRight size={12} /></div>}
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
if (active && payload && payload.length) {
return (
<div className="custom-tooltip">
<p className="tooltip-label">{label}</p>
{payload.map((entry, index) => (
<p key={index} style={{ color: entry.color }}>
{entry.name}: {typeof entry.value === ‘number’ ?
(entry.name.toLowerCase().includes(‘rev’) || entry.name.toLowerCase().includes(‘revenue’) || entry.name.toLowerCase().includes(‘value’) || entry.name.toLowerCase().includes(‘rate’) ?
formatCurrency(entry.value) : formatNumber(entry.value)) : entry.value}
</p>
))}
</div>
);
}
return null;
};

// Segment Pie Chart Drill Down Modal
const SegmentMonthlyDrillDown = ({ year, data, onClose }) => {
if (!year || !data) return null;

const monthlyData = [];
for (let m = 1; m <= 12; m++) {
const monthData = data.filter(d => d.arrivalMonthNum === m);
const corporate = monthData.filter(d => d.segmentCategory === ‘Corporate’).length;
const social = monthData.filter(d => d.segmentCategory === ‘Social’).length;
const total = corporate + social;
monthlyData.push({
month: MONTH_NAMES[m - 1],
Corporate: corporate,
Social: social,
total,
corporatePct: total > 0 ? ((corporate / total) * 100).toFixed(1) : 0,
socialPct: total > 0 ? ((social / total) * 100).toFixed(1) : 0
});
}

return (
<div className="drill-down-modal" onClick={onClose}>
<div className=“drill-down-content” onClick={e => e.stopPropagation()}>
<div className="drill-down-header">
<div>
<h3>Corporate vs Social Distribution - {year}</h3>
<div className="drill-down-summary">Monthly breakdown by segment</div>
</div>
<button className="close-btn" onClick={onClose}><X size={20} /></button>
</div>
<div style={{ padding: ‘20px’, height: ‘400px’ }}>
<ResponsiveContainer>
<BarChart data={monthlyData}>
<CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
<XAxis dataKey=“month” tick={{ fill: ‘#64748B’, fontSize: 11 }} />
<YAxis tick={{ fill: ‘#64748B’, fontSize: 11 }} />
<Tooltip content={<CustomTooltip />} />
<Legend />
<Bar dataKey=“Corporate” fill={COLORS.corporate} radius={[4, 4, 0, 0]} />
<Bar dataKey=“Social” fill={COLORS.social} radius={[4, 4, 0, 0]} />
</BarChart>
</ResponsiveContainer>
</div>
</div>
</div>
);
};

// Booking Drill Down Modal
const BookingDrillDown = ({ bookings, title, onClose, showComments = false }) => {
if (!bookings || bookings.length === 0) return null;

const totalRevenue = bookings.reduce((s, b) => s + (b.totalRevenue || 0), 0);
const totalRoomNights = bookings.reduce((s, b) => s + (b.roomNight || 0), 0);
const totalEventRevenue = bookings.reduce((s, b) => s + (b.eventRevenue || 0), 0);

return (
<div className="drill-down-modal" onClick={onClose}>
<div className=“drill-down-content” onClick={e => e.stopPropagation()}>
<div className="drill-down-header">
<div>
<h3>{title}</h3>
<div className="drill-down-summary">
{bookings.length} bookings | {formatNumber(totalRoomNights)} RN | {formatCurrency(totalRevenue)} Group Rev | {formatCurrency(totalEventRevenue)} Event Rev
</div>
</div>
<button className="close-btn" onClick={onClose}><X size={20} /></button>
</div>
<div className="drill-down-table-wrapper">
<table className="drill-down-table">
<thead>
<tr>
<th>Booking #</th>
<th>Post As Name</th>
<th>Type</th>
<th>Status</th>
<th>Grade</th>
<th>Arrival</th>
<th>Segment</th>
<th>Peak RN</th>
<th>Room Nights</th>
<th>Group Rev</th>
<th>Event Rev</th>
<th>F&B Rev</th>
<th>Rental Rev</th>
<th>Avg Rate</th>
<th>Sales Manager</th>
{showComments && <th>Reason/Comment</th>}
</tr>
</thead>
<tbody>
{bookings.slice(0, 100).map((b, idx) => (
<tr key={idx}>
<td>{b.bookingNumber}</td>
<td className="truncate">{b.postAsName || b.organizationName || ‘N/A’}</td>
<td><span className={`type-badge ${b.bookingCategory === 'Local Catering' ? 'catering' : 'group'}`}>{b.bookingCategory}</span></td>
<td><span className={`status-badge ${b.status?.toLowerCase().replace(' ', '-')}`}>{b.status}</span></td>
<td>{b.gradeLabel}</td>
<td>{b.arrivalDate ? new Date(b.arrivalDate).toLocaleDateString() : ‘N/A’}</td>
<td>{b.marketSegment}</td>
<td>{b.peakRoomNights}</td>
<td>{b.roomNight}</td>
<td>{formatCurrency(b.totalRevenue)}</td>
<td>{formatCurrency(b.eventRevenue)}</td>
<td>{formatCurrency(b.fnbRevenue)}</td>
<td>{formatCurrency(b.rentalRevenue)}</td>
<td>{formatCurrency(b.avgRate)}</td>
<td>{b.salesManager}</td>
{showComments && <td className="comment-cell">{b.terminalReason || ‘N/A’}</td>}
</tr>
))}
</tbody>
</table>
</div>
{bookings.length > 100 && <p className="more-records">Showing 100 of {bookings.length} bookings</p>}
</div>
</div>
);
};

// Theme Analysis Modal for Other C-Comments
const ThemeAnalysisModal = ({ bookings, onClose, openDrillDown }) => {
const { themes, unthemed } = analyzeCommentThemes(bookings);
return (
<div className="drill-down-modal" onClick={onClose}>
<div className=“drill-down-content” onClick={e => e.stopPropagation()}>
<div className="drill-down-header">
<div>
<h3>Other C-Comments Thematic Analysis</h3>
<div className="drill-down-summary">{bookings.length} bookings | {themes.length} themes | {unthemed.length} uncategorized</div>
</div>
<button className="close-btn" onClick={onClose}><X size={20} /></button>
</div>
<div className="theme-analysis-content">
<h4>Identified Themes</h4>
<div className="theme-grid">
{themes.map((t, idx) => (
<div key={idx} className=“theme-card” onClick={() => { onClose(); openDrillDown(t.bookings, ’Theme: ’ + t.theme, true); }}>
<span className="theme-name">{t.theme}</span>
<span className="theme-count">{t.count}</span>
</div>
))}
</div>
{unthemed.length > 0 && (
<>
<h4>Uncategorized ({unthemed.length})</h4>
<div className="unthemed-list">
{unthemed.slice(0, 15).map((b, idx) => (
<div key={idx} className="unthemed-item">
<span className="unthemed-booking">{b.bookingNumber}</span>
<span className="unthemed-comment">{b.terminalReason || ‘No comment’}</span>
</div>
))}
</div>
</>
)}
</div>
</div>
</div>
);
};

// KPI Detail Modal
const KPIDetailModal = ({ type, data, years, onClose }) => {
if (!type || !data) return null;

const getContent = () => {
switch (type) {
case ‘leadTime’:
return (
<>
<h3>Lead Time Analysis</h3>
<div className="kpi-detail-grid">
<div className="kpi-detail-stat">
<span className="stat-value">{data.avgLeadTime}d</span>
<span className="stat-label">Overall Average</span>
</div>
<div className="kpi-detail-stat">
<span className="stat-value">{data.corporateLeadTime}d</span>
<span className="stat-label">Corporate Avg</span>
</div>
<div className="kpi-detail-stat">
<span className="stat-value">{data.socialLeadTime}d</span>
<span className="stat-label">Social Avg</span>
</div>
<div className="kpi-detail-stat">
<span className="stat-value">{data.groupLeadTime}d</span>
<span className="stat-label">Group Sales Avg</span>
</div>
<div className="kpi-detail-stat">
<span className="stat-value">{data.cateringLeadTime}d</span>
<span className="stat-label">Local Catering Avg</span>
</div>
</div>
<div className="kpi-detail-chart">
<h4>Lead Time by Year</h4>
<ResponsiveContainer width="100%" height={200}>
<BarChart data={data.byYear}>
<CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
<XAxis dataKey=“year” tick={{ fontSize: 11, fill: ‘#64748B’ }} />
<YAxis tick={{ fontSize: 11, fill: ‘#64748B’ }} />
<Tooltip />
<Bar dataKey=“avgLeadTime” name=“Avg Lead Time (days)” fill={COLORS.primary} radius={[4, 4, 0, 0]} />
</BarChart>
</ResponsiveContainer>
</div>
<div className="kpi-detail-chart">
<h4>Lead Time: Corporate vs Social</h4>
<ResponsiveContainer width="100%" height={200}>
<BarChart data={data.byYear}>
<CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
<XAxis dataKey=“year” tick={{ fontSize: 11, fill: ‘#64748B’ }} />
<YAxis tick={{ fontSize: 11, fill: ‘#64748B’ }} />
<Tooltip />
<Legend />
<Bar dataKey=“corporate” name=“Corporate” fill={COLORS.corporate} radius={[4, 4, 0, 0]} />
<Bar dataKey=“social” name=“Social” fill={COLORS.social} radius={[4, 4, 0, 0]} />
</BarChart>
</ResponsiveContainer>
</div>
</>
);
case ‘conversion’:
return (
<>
<h3>Conversion Analysis</h3>
<div className="kpi-detail-grid">
<div className="kpi-detail-stat">
<span className="stat-value">{data.overall}%</span>
<span className="stat-label">Overall Rate</span>
</div>
<div className="kpi-detail-stat">
<span className="stat-value">{data.corporate}%</span>
<span className="stat-label">Corporate</span>
</div>
<div className="kpi-detail-stat">
<span className="stat-value">{data.social}%</span>
<span className="stat-label">Social</span>
</div>
<div className="kpi-detail-stat">
<span className="stat-value">{data.group}%</span>
<span className="stat-label">Group Sales</span>
</div>
<div className="kpi-detail-stat">
<span className="stat-value">{data.catering}%</span>
<span className="stat-label">Local Catering</span>
</div>
</div>
<div className="kpi-detail-chart">
<h4>Conversion Rate by Year</h4>
<ResponsiveContainer width="100%" height={200}>
<LineChart data={data.byYear}>
<CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
<XAxis dataKey=“year” tick={{ fontSize: 11, fill: ‘#64748B’ }} />
<YAxis tick={{ fontSize: 11, fill: ‘#64748B’ }} domain={[0, 30]} />
<Tooltip />
<Line type=“monotone” dataKey=“rate” name=“Conversion %” stroke={COLORS.primary} strokeWidth={2} dot={{ r: 4 }} />
</LineChart>
</ResponsiveContainer>
</div>
</>
);
case ‘response’:
return (
<>
<h3>Response Time Analysis</h3>
<div className="kpi-detail-grid">
<div className="kpi-detail-stat">
<span className="stat-value">{data.avgResponse}h</span>
<span className="stat-label">Overall Average</span>
</div>
<div className="kpi-detail-stat">
<span className="stat-value">{data.under2h}%</span>
<span className="stat-label">Under 2 Hours</span>
</div>
<div className="kpi-detail-stat">
<span className="stat-value">{data.under24h}%</span>
<span className="stat-label">Under 24 Hours</span>
</div>
</div>
<div className="kpi-detail-chart">
<h4>Response Time Distribution</h4>
<ResponsiveContainer width="100%" height={200}>
<BarChart data={data.distribution}>
<CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
<XAxis dataKey=“range” tick={{ fontSize: 10, fill: ‘#64748B’ }} />
<YAxis tick={{ fontSize: 11, fill: ‘#64748B’ }} />
<Tooltip />
<Bar dataKey=“count” name=“Responses” fill={COLORS.accent} radius={[4, 4, 0, 0]} />
</BarChart>
</ResponsiveContainer>
</div>
</>
);
case ‘roomNights’:
return (
<>
<h3>Room Nights Analysis</h3>
<div className="kpi-detail-grid">
<div className="kpi-detail-stat">
<span className="stat-value">{formatNumber(data.total)}</span>
<span className="stat-label">Total Room Nights</span>
</div>
<div className="kpi-detail-stat">
<span className="stat-value">{formatNumber(data.avgPerBooking)}</span>
<span className="stat-label">Avg per Booking</span>
</div>
<div className="kpi-detail-stat">
<span className="stat-value">{formatNumber(data.group)}</span>
<span className="stat-label">Group Sales</span>
</div>
<div className="kpi-detail-stat">
<span className="stat-value">{formatNumber(data.catering)}</span>
<span className="stat-label">Local Catering</span>
</div>
</div>
<div className="kpi-detail-chart">
<h4>Room Nights by Year</h4>
<ResponsiveContainer width="100%" height={200}>
<BarChart data={data.byYear}>
<CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
<XAxis dataKey=“year” tick={{ fontSize: 11, fill: ‘#64748B’ }} />
<YAxis tick={{ fontSize: 11, fill: ‘#64748B’ }} />
<Tooltip />
<Bar dataKey=“roomNights” name=“Room Nights” fill={COLORS.primary} radius={[4, 4, 0, 0]} />
</BarChart>
</ResponsiveContainer>
</div>
</>
);
default:
return <p>No details available</p>;
}
};

return (
<div className="drill-down-modal" onClick={onClose}>
<div className=“kpi-detail-modal” onClick={e => e.stopPropagation()}>
<div className="drill-down-header">
<div>{getContent()}</div>
<button className="close-btn" onClick={onClose}><X size={20} /></button>
</div>
</div>
</div>
);
};

// Sales Manager Deep Dive
const ManagerDeepDive = ({ manager, bookings, teamAvg, onClose }) => {
const mgrBookings = bookings.filter(b => b.salesManager && b.salesManager.toLowerCase().includes(manager.toLowerCase()));
const converted = mgrBookings.filter(b => [‘Actual’, ‘Definite’].includes(b.status));
const lost = mgrBookings.filter(b => [‘Lost’, ‘Turn Down’, ‘Cancelled’].includes(b.status));
const tentative = mgrBookings.filter(b => b.status === ‘Tentative’);

const convRate = mgrBookings.length > 0 ? ((converted.length / mgrBookings.length) * 100).toFixed(1) : 0;
const totalRevenue = converted.reduce((s, b) => s + (b.totalRevenue || 0), 0);
const totalEventRevenue = converted.reduce((s, b) => s + (b.eventRevenue || 0), 0);
const totalRoomNights = converted.reduce((s, b) => s + (b.roomNight || 0), 0);
const avgResponseTimes = mgrBookings.filter(b => b.leadResponseTime > 0);
const avgResponse = avgResponseTimes.length > 0 ? (avgResponseTimes.reduce((s, b) => s + b.leadResponseTime, 0) / avgResponseTimes.length).toFixed(1) : 0;

// Pipeline by Grade
const pipelineByGrade = {};
tentative.forEach(b => {
const g = b.gradeLabel;
if (!pipelineByGrade[g]) pipelineByGrade[g] = { grade: g, count: 0, revenue: 0, roomNights: 0 };
pipelineByGrade[g].count++;
pipelineByGrade[g].revenue += b.totalRevenue || 0;
pipelineByGrade[g].roomNights += b.roomNight || 0;
});
const pipelineData = Object.values(pipelineByGrade).sort((a, b) => a.grade.localeCompare(b.grade));

// Lost Reasons
const lostReasons = {};
lost.forEach(b => {
const reason = b.terminalReason || ‘No Reason Given’;
if (!lostReasons[reason]) lostReasons[reason] = 0;
lostReasons[reason]++;
});
const lostReasonsData = Object.entries(lostReasons).map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count).slice(0, 5);

// Market Segment Performance
const bySegment = {};
converted.forEach(b => {
const seg = b.segmentCategory;
if (!bySegment[seg]) bySegment[seg] = { segment: seg, count: 0, revenue: 0 };
bySegment[seg].count++;
bySegment[seg].revenue += b.totalRevenue || 0;
});
const segmentData = Object.values(bySegment);

// Monthly Trend
const byMonth = {};
mgrBookings.forEach(b => {
if (b.enteredMonth) {
if (!byMonth[b.enteredMonth]) byMonth[b.enteredMonth] = { month: b.enteredMonth, monthLabel: formatMonthLabel(b.enteredMonth), leads: 0, converted: 0 };
byMonth[b.enteredMonth].leads++;
if ([‘Actual’, ‘Definite’].includes(b.status)) byMonth[b.enteredMonth].converted++;
}
});
const monthlyData = Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month)).slice(-12);

// Response Time Distribution
const responseDistribution = [
{ range: ‘0-2h’, count: 0 }, { range: ‘2-4h’, count: 0 }, { range: ‘4-8h’, count: 0 },
{ range: ‘8-24h’, count: 0 }, { range: ‘24-48h’, count: 0 }, { range: ‘48h+’, count: 0 }
];
avgResponseTimes.forEach(b => {
const hrs = b.leadResponseTime;
if (hrs <= 2) responseDistribution[0].count++;
else if (hrs <= 4) responseDistribution[1].count++;
else if (hrs <= 8) responseDistribution[2].count++;
else if (hrs <= 24) responseDistribution[3].count++;
else if (hrs <= 48) responseDistribution[4].count++;
else responseDistribution[5].count++;
});

return (
<div className="drill-down-modal" onClick={onClose}>
<div className=“manager-deep-dive” onClick={e => e.stopPropagation()}>
<div className="drill-down-header">
<div className="manager-header-info">
<button className="back-btn" onClick={onClose}><ChevronLeft size={20} /> Back</button>
<div className="manager-avatar"><User size={24} /></div>
<div>
<h3>{manager}</h3>
<span className="manager-subtitle">Sales Manager Performance Analysis</span>
</div>
</div>
</div>

```
    <div className="manager-content">
      <div className="manager-kpi-row">
        <div className="manager-kpi">
          <span className="manager-kpi-value">{mgrBookings.length}</span>
          <span className="manager-kpi-label">Total Leads</span>
          <span className={`manager-kpi-compare ${mgrBookings.length > teamAvg.leads ? 'up' : 'down'}`}>
            vs {teamAvg.leads.toFixed(0)} avg
          </span>
        </div>
        <div className="manager-kpi">
          <span className="manager-kpi-value">{convRate}%</span>
          <span className="manager-kpi-label">Conversion Rate</span>
          <span className={`manager-kpi-compare ${parseFloat(convRate) > teamAvg.convRate ? 'up' : 'down'}`}>
            vs {teamAvg.convRate.toFixed(1)}% avg
          </span>
        </div>
        <div className="manager-kpi">
          <span className="manager-kpi-value">{formatCurrency(totalRevenue)}</span>
          <span className="manager-kpi-label">Group Revenue</span>
        </div>
        <div className="manager-kpi">
          <span className="manager-kpi-value">{formatCurrency(totalEventRevenue)}</span>
          <span className="manager-kpi-label">Event Revenue</span>
        </div>
        <div className="manager-kpi">
          <span className="manager-kpi-value">{formatNumber(totalRoomNights)}</span>
          <span className="manager-kpi-label">Room Nights</span>
        </div>
        <div className="manager-kpi">
          <span className="manager-kpi-value">{avgResponse}h</span>
          <span className="manager-kpi-label">Avg Response</span>
          <span className={`manager-kpi-compare ${parseFloat(avgResponse) < teamAvg.avgResponse ? 'up' : 'down'}`}>
            vs {teamAvg.avgResponse.toFixed(1)}h avg
          </span>
        </div>
      </div>
      
      <div className="manager-charts-row">
        <div className="manager-chart-card">
          <h4>Monthly Lead & Conversion Trend</h4>
          <div className="manager-chart">
            <ResponsiveContainer>
              <ComposedChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="monthLabel" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="leads" name="Leads" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                <Bar dataKey="converted" name="Converted" fill={COLORS.success} radius={[4, 4, 0, 0]} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="manager-chart-card">
          <h4>Pipeline by Grade (Tentative)</h4>
          <div className="manager-chart">
            <ResponsiveContainer>
              <BarChart data={pipelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="grade" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Bookings" fill={COLORS.warning} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="manager-chart-card">
          <h4>Response Time Distribution</h4>
          <div className="manager-chart">
            <ResponsiveContainer>
              <BarChart data={responseDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="range" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Responses" fill={COLORS.accent} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      <div className="manager-charts-row">
        <div className="manager-chart-card">
          <h4>Win/Loss Analysis</h4>
          <div className="win-loss-grid">
            <div className="win-loss-stat won">
              <span className="win-loss-value">{converted.length}</span>
              <span className="win-loss-label">Won</span>
            </div>
            <div className="win-loss-stat lost">
              <span className="win-loss-value">{lost.length}</span>
              <span className="win-loss-label">Lost/TD</span>
            </div>
            <div className="win-loss-stat pipeline">
              <span className="win-loss-value">{tentative.length}</span>
              <span className="win-loss-label">Pipeline</span>
            </div>
          </div>
          {lostReasonsData.length > 0 && (
            <div className="lost-reasons-list">
              <h5>Top Lost Reasons:</h5>
              {lostReasonsData.map((r, i) => (
                <div key={i} className="lost-reason-item">
                  <span>{r.reason}</span>
                  <span className="lost-reason-count">{r.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="manager-chart-card">
          <h4>Market Segment Performance</h4>
          <div className="manager-chart">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={segmentData}
                  dataKey="count"
                  nameKey="segment"
                  cx="50%" cy="50%"
                  outerRadius={60}
                  label={({ segment, percent }) => `${segment} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {segmentData.map((_, idx) => (
                    <Cell key={idx} fill={COLORS.chartColors[idx % COLORS.chartColors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [value, name]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
```

);
};

const HeatMapCell = ({ value, max, pctOfTotal, onClick }) => {
const intensity = max > 0 ? Math.min(value / max, 1) : 0;
const bg = intensity > 0 ? `rgba(0, 102, 255, ${0.15 + intensity * 0.75})` : ‘#F8FAFC’;
const textColor = intensity > 0.4 ? ‘white’ : ‘#1E293B’;
return (
<div className=“heat-cell” style={{ background: bg, color: textColor }} onClick={onClick}>
<span className="heat-value">{value || ‘-’}</span>
{value > 0 && pctOfTotal !== undefined && <span className="heat-pct">{pctOfTotal}%</span>}
</div>
);
};

export default function GroupBookingDashboard() {
const [rawData, setRawData] = useState(null);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState(null);
const [recordCount, setRecordCount] = useState(0);

// Global Filters
const [selectedYears, setSelectedYears] = useState([]);
const [selectedStatus, setSelectedStatus] = useState(‘all’);
const [selectedGrades, setSelectedGrades] = useState([]);
const [selectedBookingCategory, setSelectedBookingCategory] = useState(‘all’);

// Widget-specific filters
const [groupCateringYears, setGroupCateringYears] = useState([]);
const [eventRevenueYears, setEventRevenueYears] = useState([]);
const [leadVolumeYears, setLeadVolumeYears] = useState([]);
const [yoyYears, setYoyYears] = useState([]);
const [segmentYears, setSegmentYears] = useState([]);
const [leadTimeYears, setLeadTimeYears] = useState([]);
const [leadTimeSegment, setLeadTimeSegment] = useState(‘all’);
const [heatMapYears, setHeatMapYears] = useState([]);
const [heatMapGrades, setHeatMapGrades] = useState([]);
const [heatMapSegment, setHeatMapSegment] = useState(‘all’);
const [blockSizeYears, setBlockSizeYears] = useState([]);
const [blockSizeGrades, setBlockSizeGrades] = useState([]);
const [lostYears, setLostYears] = useState([]);
const [hiddenLostReasons, setHiddenLostReasons] = useState([]);

// Drill-down states
const [drillDownBookings, setDrillDownBookings] = useState(null);
const [drillDownTitle, setDrillDownTitle] = useState(’’);
const [drillDownShowComments, setDrillDownShowComments] = useState(false);
const [selectedManager, setSelectedManager] = useState(null);
const [kpiDetail, setKpiDetail] = useState(null);
const [showThemeAnalysis, setShowThemeAnalysis] = useState(null);
const [segmentDrillDown, setSegmentDrillDown] = useState(null);

const toggleHiddenReason = (reason) => {
if (hiddenLostReasons.includes(reason)) {
setHiddenLostReasons(hiddenLostReasons.filter(r => r !== reason));
} else {
setHiddenLostReasons([…hiddenLostReasons, reason]);
}
};

const clearAllFilters = () => {
setSelectedYears([]);
setSelectedStatus(‘all’);
setSelectedGrades([]);
setSelectedBookingCategory(‘all’);
};

const hasActiveFilters = selectedYears.length > 0 || selectedStatus !== ‘all’ ||
selectedGrades.length > 0 || selectedBookingCategory !== ‘all’;

const processData = useCallback((rows) => {
const processed = [];

```
// Dynamic column detection for F&B and Rental columns
const sampleRow = rows[0] || {};
const columnNames = Object.keys(sampleRow);

const fnbColumn = columnNames.find(col => 
  col.toLowerCase().includes('food and beverage') ||
  col.toLowerCase().includes('food & beverage') ||
  col.toLowerCase().includes('f&b') ||
  (col.toLowerCase().includes('event') && col.toLowerCase().includes('food'))
);

const rentalColumn = columnNames.find(col => 
  col.toLowerCase() === 'venue rental' ||
  col.toLowerCase().includes('venue rental') ||
  (col.toLowerCase().includes('venue') && col.toLowerCase().includes('rental')) ||
  col.toLowerCase().includes('meeting room rental') ||
  col.toLowerCase() === 'room rental'
);

console.log('Column detection:', { fnbColumn, rentalColumn, sampleColumns: columnNames.slice(0, 15) });

for (const row of rows) {
  const bookingNum = row['Booking Number'];
  if (!bookingNum || bookingNum === 'nan' || bookingNum === '') continue;
  
  const bookingType = (row['Booking Type'] || '').trim();
  if (bookingType.toLowerCase().includes('internal')) continue;
  
  const arrivalDate = row['Arrival Date'] || '';
  const enteredDate = row['Entered Date'] || '';
  
  let arrivalDateObj = null;
  let enteredDateObj = null;
  let leadTime = null;
  
  if (arrivalDate && arrivalDate !== 'nan') {
    arrivalDateObj = new Date(arrivalDate);
    if (isNaN(arrivalDateObj.getTime())) arrivalDateObj = null;
  }
  
  if (enteredDate && enteredDate !== 'nan') {
    enteredDateObj = new Date(enteredDate);
    if (isNaN(enteredDateObj.getTime())) enteredDateObj = null;
  }
  
  if (arrivalDateObj && enteredDateObj) {
    leadTime = Math.floor((arrivalDateObj - enteredDateObj) / (1000 * 60 * 60 * 24));
  }

  const grade = parseNum(row['Booking Grade']);
  const marketSegment = (row['Market Segment'] || '').trim();
  const peakRoomNights = parseNum(row['Peak Room Nights']);
  
  // Event Revenue Breakdown - use dynamic column detection
  const fnbRevenue = parseNum(fnbColumn ? row[fnbColumn] : (
    row['Event Revenue (Food and Beverage)'] || 
    row['F&B Revenue'] ||
    0
  ));
  const rentalRevenue = parseNum(rentalColumn ? row[rentalColumn] : (
    row['Venue Rental'] || 
    row['Meeting Room Rental'] ||
    0
  ));
  const eventRevenue = parseNum(row['Total Event Revenue'] || 0);
  
  processed.push({
    bookingNumber: bookingNum,
    bookingType,
    bookingCategory: getBookingCategory(bookingType),
    status: (row['Booking Status'] || '').trim(),
    grade,
    gradeLabel: grade === 0 ? 'Ungraded' : `Grade ${grade}`,
    arrivalDate: arrivalDateObj,
    enteredDate: enteredDateObj,
    arrivalMonth: arrivalDateObj ? `${arrivalDateObj.getFullYear()}-${String(arrivalDateObj.getMonth() + 1).padStart(2, '0')}` : null,
    enteredMonth: enteredDateObj ? `${enteredDateObj.getFullYear()}-${String(enteredDateObj.getMonth() + 1).padStart(2, '0')}` : null,
    arrivalYear: arrivalDateObj?.getFullYear(),
    enteredYear: enteredDateObj?.getFullYear(),
    arrivalMonthNum: arrivalDateObj?.getMonth() + 1,
    enteredMonthNum: enteredDateObj?.getMonth() + 1,
    marketSegment,
    segmentCategory: getSegmentCategory(marketSegment),
    bookingSource: (row['Booking Source'] || '').trim(),
    salesManager: row['Sales Manager'] || '',
    roomNight: parseNum(row['Room Night']),
    totalRevenue: parseNum(row['Total Booking Revenue']),
    eventRevenue,
    fnbRevenue,
    rentalRevenue,
    leadResponseTime: parseNum(row['Lead Response Time(hrs)']),
    avgRate: parseNum(row['Current Average Rate']),
    peakRoomNights,
    leadTime,
    postAsName: row['Booking Post As Name'] || '',
    organizationName: row['Organization Name'] || '',
    terminalReason: row['Terminal Status Reason'] || ''
  });
}

return processed;
```

}, []);

const handleFileUpload = useCallback((event) => {
const file = event.target.files?.[0];
if (!file) return;

```
setIsLoading(true);
setError(null);

const reader = new FileReader();

reader.onload = (e) => {
  try {
    Papa.parse(e.target.result, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          const processed = processData(results.data);
          if (processed.length > 0) {
            setRawData(processed);
            setRecordCount(processed.length);
            // Initialize year selections
            const yrs = [...new Set(processed.map(d => d.enteredYear).filter(Boolean))].sort();
            setSelectedYears(yrs);
            setGroupCateringYears(yrs);
            setEventRevenueYears(yrs);
            setLeadVolumeYears(yrs);
            setYoyYears(yrs);
            setSegmentYears(yrs);
            setLeadTimeYears(yrs);
            setHeatMapYears(yrs);
            setBlockSizeYears(yrs);
            setLostYears(yrs);
            setError(null);
          } else {
            setError('No valid booking data found in file');
          }
        }
        setIsLoading(false);
      },
      error: (err) => {
        setError(`CSV parsing error: ${err.message}`);
        setIsLoading(false);
      }
    });
  } catch (err) {
    setError(`Error processing file: ${err.message}`);
    setIsLoading(false);
  }
};

reader.onerror = () => {
  setError('Error reading file');
  setIsLoading(false);
};

reader.readAsText(file);
```

}, [processData]);

const filteredData = useMemo(() => {
if (!rawData) return [];
return rawData.filter(d => {
const yearMatch = selectedYears.length === 0 || selectedYears.includes(d.enteredYear);
const statusMatch = selectedStatus === ‘all’ || d.status === selectedStatus;
const gradeMatch = selectedGrades.length === 0 || selectedGrades.includes(d.gradeLabel);
const categoryMatch = selectedBookingCategory === ‘all’ || d.bookingCategory === selectedBookingCategory;
return yearMatch && statusMatch && gradeMatch && categoryMatch;
});
}, [rawData, selectedYears, selectedStatus, selectedGrades, selectedBookingCategory]);

const years = useMemo(() => {
if (!rawData) return [];
return […new Set(rawData.map(d => d.enteredYear).filter(Boolean))].sort();
}, [rawData]);

const allYearsForHeatMap = useMemo(() => {
if (!rawData) return [];
const enteredYears = rawData.map(d => d.enteredYear).filter(Boolean);
const arrivalYears = rawData.map(d => d.arrivalYear).filter(Boolean);
return […new Set([…enteredYears, …arrivalYears])].sort();
}, [rawData]);

const statuses = useMemo(() => {
if (!rawData) return [];
return […new Set(rawData.map(d => d.status).filter(Boolean))];
}, [rawData]);

const grades = useMemo(() => {
if (!rawData) return [];
return […new Set(rawData.map(d => d.gradeLabel).filter(Boolean))].sort((a, b) => {
if (a === ‘Ungraded’) return -1;
if (b === ‘Ungraded’) return 1;
return a.localeCompare(b);
});
}, [rawData]);

const analytics = useMemo(() => {
if (!filteredData.length) return null;

```
const totalLeads = filteredData.length;
const convertedBookings = filteredData.filter(d => ['Actual', 'Definite'].includes(d.status));
const tentativeBookings = filteredData.filter(d => d.status === 'Tentative');
const lostBookings = filteredData.filter(d => ['Lost', 'Turn Down', 'Cancelled'].includes(d.status));

const totalRoomNights = convertedBookings.reduce((sum, d) => sum + (d.roomNight || 0), 0);
const totalRevenue = convertedBookings.reduce((sum, d) => sum + (d.totalRevenue || 0), 0);
const totalEventRevenue = convertedBookings.reduce((sum, d) => sum + (d.eventRevenue || 0), 0);
const totalFnBRevenue = convertedBookings.reduce((sum, d) => sum + (d.fnbRevenue || 0), 0);
const totalRentalRevenue = convertedBookings.reduce((sum, d) => sum + (d.rentalRevenue || 0), 0);
const conversionRate = totalLeads > 0 ? ((convertedBookings.length / totalLeads) * 100).toFixed(1) : 0;

// Calculate YoY variances for KPIs
const calculateYoY = (metric) => {
  if (selectedYears.length !== 1) return null; // Only show for single year
  const currentYear = selectedYears[0];
  const priorYear = currentYear - 1;
  
  const currentData = filteredData.filter(d => d.enteredYear === currentYear);
  const priorData = rawData.filter(d => d.enteredYear === priorYear);
  
  if (priorData.length === 0) return null;
  
  const getCurrentValue = () => {
    switch(metric) {
      case 'leads': return currentData.length;
      case 'conversion': {
        const converted = currentData.filter(d => ['Actual', 'Definite'].includes(d.status));
        return currentData.length > 0 ? (converted.length / currentData.length) * 100 : 0;
      }
      case 'converted': return currentData.filter(d => ['Actual', 'Definite'].includes(d.status)).length;
      case 'roomNights': return currentData.filter(d => ['Actual', 'Definite'].includes(d.status)).reduce((s, d) => s + (d.roomNight || 0), 0);
      case 'groupRevenue': return currentData.filter(d => ['Actual', 'Definite'].includes(d.status)).reduce((s, d) => s + (d.totalRevenue || 0), 0);
      case 'eventRevenue': return currentData.filter(d => ['Actual', 'Definite'].includes(d.status)).reduce((s, d) => s + (d.eventRevenue || 0), 0);
      case 'fnbRevenue': return currentData.filter(d => ['Actual', 'Definite'].includes(d.status)).reduce((s, d) => s + (d.fnbRevenue || 0), 0);
      case 'rentalRevenue': return currentData.filter(d => ['Actual', 'Definite'].includes(d.status)).reduce((s, d) => s + (d.rentalRevenue || 0), 0);
      case 'leadTime': {
        const valid = currentData.filter(d => d.leadTime > 0);
        return valid.length > 0 ? valid.reduce((s, d) => s + d.leadTime, 0) / valid.length : 0;
      }
      case 'responseTime': {
        const valid = currentData.filter(d => d.leadResponseTime > 0);
        return valid.length > 0 ? valid.reduce((s, d) => s + d.leadResponseTime, 0) / valid.length : 0;
      }
      case 'spendPerRN': {
        const converted = currentData.filter(d => ['Actual', 'Definite'].includes(d.status) && d.bookingCategory === 'Group Sales');
        const rn = converted.reduce((s, d) => s + (d.roomNight || 0), 0);
        const eventRev = converted.reduce((s, d) => s + (d.eventRevenue || 0), 0);
        return rn > 0 ? eventRev / rn : 0;
      }
      case 'pipeline': return currentData.filter(d => d.status === 'Tentative').length;
      default: return 0;
    }
  };
  
  const getPriorValue = () => {
    switch(metric) {
      case 'leads': return priorData.length;
      case 'conversion': {
        const converted = priorData.filter(d => ['Actual', 'Definite'].includes(d.status));
        return priorData.length > 0 ? (converted.length / priorData.length) * 100 : 0;
      }
      case 'converted': return priorData.filter(d => ['Actual', 'Definite'].includes(d.status)).length;
      case 'roomNights': return priorData.filter(d => ['Actual', 'Definite'].includes(d.status)).reduce((s, d) => s + (d.roomNight || 0), 0);
      case 'groupRevenue': return priorData.filter(d => ['Actual', 'Definite'].includes(d.status)).reduce((s, d) => s + (d.totalRevenue || 0), 0);
      case 'eventRevenue': return priorData.filter(d => ['Actual', 'Definite'].includes(d.status)).reduce((s, d) => s + (d.eventRevenue || 0), 0);
      case 'fnbRevenue': return priorData.filter(d => ['Actual', 'Definite'].includes(d.status)).reduce((s, d) => s + (d.fnbRevenue || 0), 0);
      case 'rentalRevenue': return priorData.filter(d => ['Actual', 'Definite'].includes(d.status)).reduce((s, d) => s + (d.rentalRevenue || 0), 0);
      case 'leadTime': {
        const valid = priorData.filter(d => d.leadTime > 0);
        return valid.length > 0 ? valid.reduce((s, d) => s + d.leadTime, 0) / valid.length : 0;
      }
      case 'responseTime': {
        const valid = priorData.filter(d => d.leadResponseTime > 0);
        return valid.length > 0 ? valid.reduce((s, d) => s + d.leadResponseTime, 0) / valid.length : 0;
      }
      case 'spendPerRN': {
        const converted = priorData.filter(d => ['Actual', 'Definite'].includes(d.status) && d.bookingCategory === 'Group Sales');
        const rn = converted.reduce((s, d) => s + (d.roomNight || 0), 0);
        const eventRev = converted.reduce((s, d) => s + (d.eventRevenue || 0), 0);
        return rn > 0 ? eventRev / rn : 0;
      }
      case 'pipeline': return priorData.filter(d => d.status === 'Tentative').length;
      default: return 0;
    }
  };
  
  const current = getCurrentValue();
  const prior = getPriorValue();
  
  if (prior === 0) return null;
  return parseFloat((((current - prior) / prior) * 100).toFixed(1));
};

const validLeadTimes = filteredData.filter(d => d.leadTime > 0);
const avgLeadTime = validLeadTimes.length > 0 ? Math.round(validLeadTimes.reduce((sum, d) => sum + d.leadTime, 0) / validLeadTimes.length) : 0;

const validResponseTimes = filteredData.filter(d => d.leadResponseTime > 0);
const avgResponseTime = validResponseTimes.length > 0 ? (validResponseTimes.reduce((sum, d) => sum + d.leadResponseTime, 0) / validResponseTimes.length).toFixed(1) : 0;

const avgBookingValue = convertedBookings.length > 0 ? totalRevenue / convertedBookings.length : 0;

// KPI Details for drill-downs
const corporateLeads = filteredData.filter(d => d.segmentCategory === 'Corporate' && d.leadTime > 0);
const socialLeads = filteredData.filter(d => d.segmentCategory === 'Social' && d.leadTime > 0);
const groupLeads = filteredData.filter(d => d.bookingCategory === 'Group Sales' && d.leadTime > 0);
const cateringLeads = filteredData.filter(d => d.bookingCategory === 'Local Catering' && d.leadTime > 0);

const leadTimeByYear = {};
years.forEach(y => leadTimeByYear[y] = { year: y, avgLeadTime: 0, corporate: 0, social: 0, count: 0, corpCount: 0, socialCount: 0 });
validLeadTimes.forEach(d => {
  if (d.enteredYear && leadTimeByYear[d.enteredYear]) {
    leadTimeByYear[d.enteredYear].avgLeadTime += d.leadTime;
    leadTimeByYear[d.enteredYear].count++;
    if (d.segmentCategory === 'Corporate') {
      leadTimeByYear[d.enteredYear].corporate += d.leadTime;
      leadTimeByYear[d.enteredYear].corpCount++;
    } else {
      leadTimeByYear[d.enteredYear].social += d.leadTime;
      leadTimeByYear[d.enteredYear].socialCount++;
    }
  }
});
const leadTimeDetailByYear = Object.values(leadTimeByYear).map(y => ({
  year: y.year,
  avgLeadTime: y.count > 0 ? Math.round(y.avgLeadTime / y.count) : 0,
  corporate: y.corpCount > 0 ? Math.round(y.corporate / y.corpCount) : 0,
  social: y.socialCount > 0 ? Math.round(y.social / y.socialCount) : 0
}));

const kpiDetails = {
  leadTime: {
    avgLeadTime,
    corporateLeadTime: corporateLeads.length > 0 ? Math.round(corporateLeads.reduce((s, d) => s + d.leadTime, 0) / corporateLeads.length) : 0,
    socialLeadTime: socialLeads.length > 0 ? Math.round(socialLeads.reduce((s, d) => s + d.leadTime, 0) / socialLeads.length) : 0,
    groupLeadTime: groupLeads.length > 0 ? Math.round(groupLeads.reduce((s, d) => s + d.leadTime, 0) / groupLeads.length) : 0,
    cateringLeadTime: cateringLeads.length > 0 ? Math.round(cateringLeads.reduce((s, d) => s + d.leadTime, 0) / cateringLeads.length) : 0,
    byYear: leadTimeDetailByYear
  },
  conversion: {
    overall: conversionRate,
    corporate: (() => {
      const corp = filteredData.filter(d => d.segmentCategory === 'Corporate');
      const corpConv = corp.filter(d => ['Actual', 'Definite'].includes(d.status));
      return corp.length > 0 ? ((corpConv.length / corp.length) * 100).toFixed(1) : 0;
    })(),
    social: (() => {
      const soc = filteredData.filter(d => d.segmentCategory === 'Social');
      const socConv = soc.filter(d => ['Actual', 'Definite'].includes(d.status));
      return soc.length > 0 ? ((socConv.length / soc.length) * 100).toFixed(1) : 0;
    })(),
    group: (() => {
      const grp = filteredData.filter(d => d.bookingCategory === 'Group Sales');
      const grpConv = grp.filter(d => ['Actual', 'Definite'].includes(d.status));
      return grp.length > 0 ? ((grpConv.length / grp.length) * 100).toFixed(1) : 0;
    })(),
    catering: (() => {
      const cat = filteredData.filter(d => d.bookingCategory === 'Local Catering');
      const catConv = cat.filter(d => ['Actual', 'Definite'].includes(d.status));
      return cat.length > 0 ? ((catConv.length / cat.length) * 100).toFixed(1) : 0;
    })(),
    byYear: years.map(y => {
      const yData = filteredData.filter(d => d.enteredYear === y);
      const yConv = yData.filter(d => ['Actual', 'Definite'].includes(d.status));
      return { year: y, rate: yData.length > 0 ? parseFloat(((yConv.length / yData.length) * 100).toFixed(1)) : 0 };
    })
  },
  response: {
    avgResponse: avgResponseTime,
    under2h: validResponseTimes.length > 0 ? ((validResponseTimes.filter(d => d.leadResponseTime <= 2).length / validResponseTimes.length) * 100).toFixed(1) : 0,
    under24h: validResponseTimes.length > 0 ? ((validResponseTimes.filter(d => d.leadResponseTime <= 24).length / validResponseTimes.length) * 100).toFixed(1) : 0,
    distribution: [
      { range: '0-2h', count: validResponseTimes.filter(d => d.leadResponseTime <= 2).length },
      { range: '2-4h', count: validResponseTimes.filter(d => d.leadResponseTime > 2 && d.leadResponseTime <= 4).length },
      { range: '4-8h', count: validResponseTimes.filter(d => d.leadResponseTime > 4 && d.leadResponseTime <= 8).length },
      { range: '8-24h', count: validResponseTimes.filter(d => d.leadResponseTime > 8 && d.leadResponseTime <= 24).length },
      { range: '24-48h', count: validResponseTimes.filter(d => d.leadResponseTime > 24 && d.leadResponseTime <= 48).length },
      { range: '48h+', count: validResponseTimes.filter(d => d.leadResponseTime > 48).length }
    ]
  },
  roomNights: {
    total: totalRoomNights,
    avgPerBooking: convertedBookings.length > 0 ? Math.round(totalRoomNights / convertedBookings.length) : 0,
    group: convertedBookings.filter(d => d.bookingCategory === 'Group Sales').reduce((s, d) => s + (d.roomNight || 0), 0),
    catering: convertedBookings.filter(d => d.bookingCategory === 'Local Catering').reduce((s, d) => s + (d.roomNight || 0), 0),
    byYear: years.map(y => ({
      year: y,
      roomNights: convertedBookings.filter(d => d.enteredYear === y).reduce((s, d) => s + (d.roomNight || 0), 0)
    }))
  }
};

// Group vs Local Catering with widget-specific year filter
const gcData = rawData.filter(d => 
  (groupCateringYears.length === 0 || groupCateringYears.includes(d.enteredYear)) &&
  ['Actual', 'Definite'].includes(d.status)
);
const groupSalesBookings = gcData.filter(d => d.bookingCategory === 'Group Sales');
const localCateringBookings = gcData.filter(d => d.bookingCategory === 'Local Catering');

const groupVsCatering = {
  group: {
    bookings: groupSalesBookings,
    count: groupSalesBookings.length,
    roomNights: groupSalesBookings.reduce((s, d) => s + (d.roomNight || 0), 0),
    groupRevenue: groupSalesBookings.reduce((s, d) => s + (d.totalRevenue || 0), 0),
    eventRevenue: groupSalesBookings.reduce((s, d) => s + (d.eventRevenue || 0), 0),
    fnbRevenue: groupSalesBookings.reduce((s, d) => s + (d.fnbRevenue || 0), 0),
    rentalRevenue: groupSalesBookings.reduce((s, d) => s + (d.rentalRevenue || 0), 0)
  },
  catering: {
    bookings: localCateringBookings,
    count: localCateringBookings.length,
    roomNights: localCateringBookings.reduce((s, d) => s + (d.roomNight || 0), 0),
    groupRevenue: localCateringBookings.reduce((s, d) => s + (d.totalRevenue || 0), 0),
    eventRevenue: localCateringBookings.reduce((s, d) => s + (d.eventRevenue || 0), 0),
    fnbRevenue: localCateringBookings.reduce((s, d) => s + (d.fnbRevenue || 0), 0),
    rentalRevenue: localCateringBookings.reduce((s, d) => s + (d.rentalRevenue || 0), 0)
  }
};

// Event Revenue by Year with widget-specific filter
const erData = rawData.filter(d => 
  (eventRevenueYears.length === 0 || eventRevenueYears.includes(d.enteredYear)) &&
  ['Actual', 'Definite'].includes(d.status)
);
const eventRevenueByYear = {};
erData.forEach(d => {
  if (d.enteredYear) {
    if (!eventRevenueByYear[d.enteredYear]) {
      eventRevenueByYear[d.enteredYear] = { year: d.enteredYear, fnb: 0, rental: 0, total: 0 };
    }
    eventRevenueByYear[d.enteredYear].fnb += d.fnbRevenue || 0;
    eventRevenueByYear[d.enteredYear].rental += d.rentalRevenue || 0;
    eventRevenueByYear[d.enteredYear].total += d.eventRevenue || 0;
  }
});
const eventRevenueData = Object.values(eventRevenueByYear).sort((a, b) => a.year - b.year);

// Spend per Group Room Night
const groupRoomNights = groupVsCatering.group.roomNights;
const groupEventRevenue = groupVsCatering.group.eventRevenue;
const spendPerGroupRN = groupRoomNights > 0 ? groupEventRevenue / groupRoomNights : 0;

// Monthly trend with widget-specific filter - restructured for year-based bars
const lvData = rawData.filter(d => leadVolumeYears.length === 0 || leadVolumeYears.includes(d.enteredYear));
const monthlyByYear = {};

// First organize by month, then by year
for (let m = 1; m <= 12; m++) {
  const monthName = MONTH_NAMES[m - 1];
  monthlyByYear[monthName] = { month: monthName };
  
  leadVolumeYears.forEach(year => {
    const monthData = lvData.filter(d => d.enteredYear === year && d.enteredMonthNum === m);
    monthlyByYear[monthName][`y${year}`] = monthData.length;
  });
}

const monthlyTrend = Object.values(monthlyByYear);

// Calculate month-over-month lead growth between periods
const leadGrowthByMonth = [];
if (leadVolumeYears.length === 2) {
  const [year1, year2] = leadVolumeYears.sort();
  for (let m = 1; m <= 12; m++) {
    const monthName = MONTH_NAMES[m - 1];
    const y1Data = lvData.filter(d => d.enteredYear === year1 && d.enteredMonthNum === m).length;
    const y2Data = lvData.filter(d => d.enteredYear === year2 && d.enteredMonthNum === m).length;
    const growth = y1Data > 0 ? (((y2Data - y1Data) / y1Data) * 100).toFixed(1) : 0;
    leadGrowthByMonth.push({
      month: monthName,
      growth: parseFloat(growth),
      y1: y1Data,
      y2: y2Data
    });
  }
}

// Corporate vs Social with widget-specific filter
const segData = rawData.filter(d => segmentYears.length === 0 || segmentYears.includes(d.enteredYear));
const segmentByYear = {};
segData.forEach(d => {
  if (d.enteredYear) {
    if (!segmentByYear[d.enteredYear]) {
      segmentByYear[d.enteredYear] = { year: d.enteredYear, Corporate: 0, Social: 0, total: 0 };
    }
    segmentByYear[d.enteredYear][d.segmentCategory]++;
    segmentByYear[d.enteredYear].total++;
  }
});
const segmentComparison = Object.values(segmentByYear).sort((a, b) => a.year - b.year).map(y => ({
  ...y,
  corporatePct: y.total > 0 ? ((y.Corporate / y.total) * 100).toFixed(1) : 0,
  socialPct: y.total > 0 ? ((y.Social / y.total) * 100).toFixed(1) : 0
}));

// Lead Time Distribution with widget-specific filter and segment filter
const ltData = rawData.filter(d => 
  (leadTimeYears.length === 0 || leadTimeYears.includes(d.enteredYear)) && 
  d.leadTime > 0 &&
  (leadTimeSegment === 'all' || d.segmentCategory === leadTimeSegment)
);
const leadTimeRanges = [
  { key: '0-30', min: 0, max: 30 }, { key: '31-60', min: 31, max: 60 },
  { key: '61-90', min: 61, max: 90 }, { key: '91-120', min: 91, max: 120 },
  { key: '121-180', min: 121, max: 180 }, { key: '181-270', min: 181, max: 270 },
  { key: '271-365', min: 271, max: 365 }, { key: '366-545', min: 366, max: 545 },
  { key: '546-730', min: 546, max: 730 }, { key: '731+', min: 731, max: Infinity }
];

const leadTimeByYearWidget = {};
leadTimeYears.forEach(year => {
  leadTimeByYearWidget[year] = {};
  leadTimeRanges.forEach(r => leadTimeByYearWidget[year][r.key] = 0);
});

ltData.forEach(d => {
  const range = leadTimeRanges.find(r => d.leadTime >= r.min && d.leadTime <= r.max);
  if (range && d.enteredYear && leadTimeByYearWidget[d.enteredYear]) {
    leadTimeByYearWidget[d.enteredYear][range.key]++;
  }
});

const leadTimeComparison = leadTimeRanges.map(r => {
  const row = { range: r.key };
  leadTimeYears.forEach(year => {
    row[`y${year}`] = leadTimeByYearWidget[year]?.[r.key] || 0;
  });
  return row;
});

// Arrival Heat Map with widget filters and segment filter - normalize to 100% per year
const hmData = rawData.filter(d => 
  (heatMapYears.length === 0 || heatMapYears.includes(d.arrivalYear)) &&
  (heatMapGrades.length === 0 || heatMapGrades.includes(d.gradeLabel)) &&
  (heatMapSegment === 'all' || d.segmentCategory === heatMapSegment)
);

const arrivalHeatMap = {};
const hmYears = heatMapYears.length > 0 ? heatMapYears : allYearsForHeatMap;
const yearTotals = {};

hmYears.forEach(year => {
  arrivalHeatMap[year] = {};
  yearTotals[year] = 0;
  for (let m = 1; m <= 12; m++) {
    arrivalHeatMap[year][m] = [];
  }
});

hmData.forEach(d => {
  if (d.arrivalYear && d.arrivalMonthNum && arrivalHeatMap[d.arrivalYear]) {
    arrivalHeatMap[d.arrivalYear][d.arrivalMonthNum].push(d);
    yearTotals[d.arrivalYear]++;
  }
});

// Block Size with widget filters
const bsData = rawData.filter(d => 
  (blockSizeYears.length === 0 || blockSizeYears.includes(d.enteredYear)) &&
  (blockSizeGrades.length === 0 || blockSizeGrades.includes(d.gradeLabel)) &&
  d.peakRoomNights > 0
);
const blockSizeBuckets = {
  '1-5': { label: '1-5 RN', min: 1, max: 5, count: 0, revenue: 0, bookings: [] },
  '6-10': { label: '6-10 RN', min: 6, max: 10, count: 0, revenue: 0, bookings: [] },
  '11-20': { label: '11-20 RN', min: 11, max: 20, count: 0, revenue: 0, bookings: [] },
  '21-35': { label: '21-35 RN', min: 21, max: 35, count: 0, revenue: 0, bookings: [] },
  '36-50': { label: '36-50 RN', min: 36, max: 50, count: 0, revenue: 0, bookings: [] },
  '51-75': { label: '51-75 RN', min: 51, max: 75, count: 0, revenue: 0, bookings: [] },
  '76-100': { label: '76-100 RN', min: 76, max: 100, count: 0, revenue: 0, bookings: [] },
  '101+': { label: '101+ RN', min: 101, max: Infinity, count: 0, revenue: 0, bookings: [] }
};

bsData.forEach(d => {
  const bucket = Object.values(blockSizeBuckets).find(b => d.peakRoomNights >= b.min && d.peakRoomNights <= b.max);
  if (bucket) {
    bucket.count++;
    bucket.revenue += d.totalRevenue || 0;
    bucket.bookings.push(d);
  }
});
const blockSizeAnalysis = Object.values(blockSizeBuckets);

// Sales Manager Performance - Whitney Britton and Anna Lawless only (exact match)
const byManager = {};
filteredData.forEach(d => {
  const mgr = d.salesManager || '';
  if (!ALLOWED_MANAGERS.includes(mgr)) return;
  
  if (!byManager[mgr]) byManager[mgr] = { manager: mgr, leads: 0, converted: 0, revenue: 0, eventRevenue: 0, roomNights: 0, responseTimes: [], rates: [], bookings: [] };
  byManager[mgr].leads++;
  byManager[mgr].bookings.push(d);
  if (d.leadResponseTime > 0) byManager[mgr].responseTimes.push(d.leadResponseTime);
  if (d.avgRate > 0) byManager[mgr].rates.push(d.avgRate);
  if (['Actual', 'Definite'].includes(d.status)) {
    byManager[mgr].converted++;
    byManager[mgr].revenue += d.totalRevenue || 0;
    byManager[mgr].eventRevenue += d.eventRevenue || 0;
    byManager[mgr].roomNights += d.roomNight || 0;
  }
});
const managerPerformance = Object.values(byManager)
  .map(m => ({
    ...m,
    conversionRate: m.leads > 0 ? parseFloat(((m.converted / m.leads) * 100).toFixed(1)) : 0,
    avgResponseTime: m.responseTimes.length > 0 ? parseFloat((m.responseTimes.reduce((a, b) => a + b, 0) / m.responseTimes.length).toFixed(1)) : 0,
    avgRate: m.rates.length > 0 ? m.rates.reduce((a, b) => a + b, 0) / m.rates.length : 0,
    avgBookingValue: m.converted > 0 ? m.revenue / m.converted : 0
  }))
  .sort((a, b) => b.converted - a.converted);

// Team averages
const teamAvg = {
  leads: managerPerformance.length > 0 ? managerPerformance.reduce((s, m) => s + m.leads, 0) / managerPerformance.length : 0,
  convRate: managerPerformance.length > 0 ? managerPerformance.reduce((s, m) => s + m.conversionRate, 0) / managerPerformance.length : 0,
  avgResponse: managerPerformance.filter(m => m.avgResponseTime > 0).length > 0 ? 
    managerPerformance.filter(m => m.avgResponseTime > 0).reduce((s, m) => s + m.avgResponseTime, 0) / managerPerformance.filter(m => m.avgResponseTime > 0).length : 0
};

// YoY Comparison
const yoyData = {};
rawData?.filter(d => yoyYears.includes(d.enteredYear)).forEach(d => {
  if (d.enteredYear && d.enteredMonthNum) {
    const key = d.enteredMonthNum;
    if (!yoyData[key]) yoyData[key] = { month: key, monthName: MONTH_NAMES[key - 1] };
    const yearKey = `y${d.enteredYear}`;
    yoyData[key][yearKey] = (yoyData[key][yearKey] || 0) + 1;
  }
});
const yoyComparison = Object.values(yoyData).sort((a, b) => a.month - b.month);

// Pipeline by Grade
const pipelineByGrade = {};
tentativeBookings.forEach(d => {
  const g = d.gradeLabel;
  if (!pipelineByGrade[g]) pipelineByGrade[g] = { grade: g, count: 0, roomNights: 0, revenue: 0, eventRevenue: 0, bookings: [] };
  pipelineByGrade[g].count++;
  pipelineByGrade[g].roomNights += d.roomNight || 0;
  pipelineByGrade[g].revenue += d.totalRevenue || 0;
  pipelineByGrade[g].eventRevenue += d.eventRevenue || 0;
  pipelineByGrade[g].bookings.push(d);
});
const pipelineSnapshot = Object.values(pipelineByGrade).sort((a, b) => {
  if (a.grade === 'Ungraded') return 1;
  if (b.grade === 'Ungraded') return -1;
  return a.grade.localeCompare(b.grade);
});

// Lost & Turn Down Analysis with YoY comparison - THEMATIC GROUPING
const lostData = rawData.filter(d => 
  (lostYears.length === 0 || lostYears.includes(d.enteredYear)) &&
  ['Lost', 'Turn Down', 'Cancelled'].includes(d.status)
);

const lostReasonsByYear = {};
lostData.forEach(d => {
  const originalReason = d.terminalReason || 'No Reason Given';
  const reason = categorizeLostReason(originalReason); // Apply thematic grouping
  const year = d.enteredYear;
  if (!lostReasonsByYear[reason]) lostReasonsByYear[reason] = { reason, years: {}, total: 0, bookings: [] };
  if (!lostReasonsByYear[reason].years[year]) lostReasonsByYear[reason].years[year] = 0;
  lostReasonsByYear[reason].years[year]++;
  lostReasonsByYear[reason].total++;
  lostReasonsByYear[reason].bookings.push(d);
});

const lostAnalysis = Object.values(lostReasonsByYear)
  .sort((a, b) => b.total - a.total)
  .slice(0, 15)
  .map(r => {
    const row = { reason: r.reason, total: r.total, bookings: r.bookings };
    lostYears.forEach(y => {
      row[`y${y}`] = r.years[y] || 0;
    });
    return row;
  });

return {
  totalLeads,
  totalRoomNights,
  totalRevenue,
  totalEventRevenue,
  totalFnBRevenue,
  totalRentalRevenue,
  conversionRate,
  avgLeadTime,
  avgResponseTime,
  avgBookingValue,
  convertedCount: convertedBookings.length,
  tentativeCount: tentativeBookings.length,
  lostCount: lostBookings.length,
  spendPerGroupRN,
  groupVsCatering,
  eventRevenueData,
  monthlyTrend,
  leadGrowthByMonth,
  segmentComparison,
  leadTimeComparison,
  arrivalHeatMap,
  yearTotals,
  managerPerformance,
  teamAvg,
  yoyComparison,
  pipelineSnapshot,
  blockSizeAnalysis,
  lostAnalysis,
  kpiDetails,
  yoyVariances: {
    leads: calculateYoY('leads'),
    conversion: calculateYoY('conversion'),
    converted: calculateYoY('converted'),
    roomNights: calculateYoY('roomNights'),
    groupRevenue: calculateYoY('groupRevenue'),
    eventRevenue: calculateYoY('eventRevenue'),
    fnbRevenue: calculateYoY('fnbRevenue'),
    rentalRevenue: calculateYoY('rentalRevenue'),
    leadTime: calculateYoY('leadTime'),
    responseTime: calculateYoY('responseTime'),
    spendPerRN: calculateYoY('spendPerRN'),
    pipeline: calculateYoY('pipeline')
  }
};
```

}, [filteredData, rawData, years, groupCateringYears, eventRevenueYears, leadVolumeYears, yoyYears, segmentYears, leadTimeYears, leadTimeSegment, heatMapYears, heatMapGrades, heatMapSegment, blockSizeYears, blockSizeGrades, lostYears, allYearsForHeatMap]);

const openDrillDown = (bookings, title, showComments = false) => {
setDrillDownBookings(bookings);
setDrillDownTitle(title);
setDrillDownShowComments(showComments);
};

const handleMonthClick = (monthKey) => {
const bookings = filteredData.filter(d => d.enteredMonth === monthKey);
openDrillDown(bookings, `Leads Entered: ${formatMonthLabel(monthKey)}`);
};

const handleHeatMapClick = (year, month, bookings) => {
if (bookings && bookings.length > 0) {
openDrillDown(bookings, `Arrivals: ${MONTH_NAMES[month - 1]} ${year}`);
}
};

const styles = `
@import url(‘https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap’);

```
* { box-sizing: border-box; margin: 0; padding: 0; }

.dashboard {
  min-height: 100vh;
  background: #F1F5F9;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  color: #1E293B;
}

.dashboard-header {
  background: linear-gradient(135deg, #0066FF 0%, #0052CC 100%);
  padding: 16px 32px;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 4px 20px rgba(0,102,255,0.2);
}

.header-content { max-width: 1900px; margin: 0 auto; }

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.brand h1 { font-size: 18px; font-weight: 600; color: white; }
.brand-subtitle { font-size: 11px; color: rgba(255,255,255,0.8); margin-top: 2px; }

.yoy-variance { font-size: 9px; margin-top: 4px; font-weight: 500; display: flex; align-items: center; gap: 4px; }
.yoy-variance.positive { color: #10B981; }
.yoy-variance.negative { color: #EF4444; }
.yoy-variance.neutral { color: #94A3B8; }

.header-actions { display: flex; gap: 12px; align-items: center; }

.record-badge {
  background: rgba(255,255,255,0.2);
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
}

.upload-btn {
  background: white;
  color: #0066FF;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
}

.file-input { display: none; }

.filters-row {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}

.filter-group { display: flex; align-items: center; gap: 6px; }

.filter-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: rgba(255,255,255,0.7);
  font-weight: 500;
}

.filter-select {
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.3);
  color: white;
  padding: 6px 28px 6px 10px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
}

.filter-select option { color: #1E293B; background: white; }

.toggle-group { display: flex; gap: 4px; flex-wrap: wrap; }
.toggle-group.small { gap: 2px; }
.toggle-group.small .toggle-btn { padding: 2px 6px; font-size: 9px; }

.toggle-btn {
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.3);
  color: rgba(255,255,255,0.8);
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.15s;
}

.toggle-btn:hover { background: rgba(255,255,255,0.2); }
.toggle-btn.active { background: white; color: #0066FF; border-color: white; }

.clear-filters-btn {
  background: rgba(239,68,68,0.2);
  border: 1px solid rgba(239,68,68,0.5);
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 11px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
}

.upload-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 70vh;
  padding: 40px;
}

.upload-box {
  background: white;
  border: 2px dashed #CBD5E1;
  border-radius: 16px;
  padding: 48px 64px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  max-width: 500px;
}

.upload-box:hover { border-color: #0066FF; }

.upload-icon { color: #0066FF; margin-bottom: 16px; }
.upload-title { font-size: 20px; font-weight: 600; margin-bottom: 8px; }
.upload-subtitle { color: #64748B; font-size: 14px; margin-bottom: 24px; }

.btn-primary {
  background: linear-gradient(135deg, #0066FF 0%, #0052CC 100%);
  color: white;
  border: none;
  padding: 12px 28px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.error-box {
  background: #FEF2F2;
  border: 1px solid #FECACA;
  border-radius: 8px;
  padding: 16px;
  margin-top: 20px;
  display: flex;
  gap: 12px;
}

.error-box p { color: #DC2626; font-size: 13px; }

.dashboard-content { max-width: 1900px; margin: 0 auto; padding: 20px 32px; }

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 10px;
  margin-bottom: 20px;
}

.kpi-card {
  background: white;
  border-radius: 10px;
  padding: 12px 14px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  border: 1px solid #E2E8F0;
  transition: all 0.2s;
}

.kpi-card.clickable { cursor: pointer; }
.kpi-card.clickable:hover { border-color: #0066FF; box-shadow: 0 4px 12px rgba(0,102,255,0.15); transform: translateY(-2px); }

.kpi-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }

.kpi-title {
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #64748B;
  font-weight: 500;
}

.kpi-icon-wrapper {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  background: linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4F46E5;
}

.kpi-value { font-size: 20px; font-weight: 700; color: #1E293B; line-height: 1; }
.kpi-subtitle { font-size: 9px; color: #94A3B8; margin-top: 3px; }
.kpi-click-hint { font-size: 9px; color: #0066FF; margin-top: 4px; display: flex; align-items: center; gap: 2px; }

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #1E293B;
  margin: 20px 0 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-title::before {
  content: '';
  width: 4px;
  height: 18px;
  background: #0066FF;
  border-radius: 2px;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.chart-card {
  background: white;
  border-radius: 10px;
  padding: 16px 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  border: 1px solid #E2E8F0;
}

.chart-card.span-2 { grid-column: span 2; }

.widget-header { margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #E2E8F0; }

.widget-title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
}

.widget-filters {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.widget-filters .toggle-btn {
  background: #F1F5F9;
  border-color: #E2E8F0;
  color: #64748B;
}

.widget-filters .toggle-btn.active {
  background: #0066FF;
  border-color: #0066FF;
  color: white;
}

.chart-title { font-size: 14px; font-weight: 600; color: #1E293B; }
.chart-subtitle { font-size: 11px; color: #64748B; margin-top: 2px; display: block; }
.chart-content { height: 260px; }
.chart-content.tall { height: 320px; }

.custom-tooltip {
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 11px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.tooltip-label {
  font-weight: 600;
  color: #1E293B;
  margin-bottom: 6px;
  border-bottom: 1px solid #E2E8F0;
  padding-bottom: 4px;
}

.segment-pies { display: flex; gap: 16px; justify-content: space-around; flex-wrap: wrap; }

.segment-pie { text-align: center; flex: 1; min-width: 140px; }
.segment-pie h4 { font-size: 14px; font-weight: 600; margin-bottom: 8px; color: #1E293B; }

.revenue-breakdown-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.breakdown-card {
  background: #F8FAFC;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.breakdown-card:hover { background: #F1F5F9; }

.breakdown-card h4 {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.breakdown-card h4 .badge {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 500;
}

.breakdown-card h4 .badge.group { background: #DBEAFE; color: #2563EB; }
.breakdown-card h4 .badge.catering { background: #D1FAE5; color: #059669; }

.breakdown-stat {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #E2E8F0;
  font-size: 12px;
}

.breakdown-stat:last-child { border-bottom: none; }
.breakdown-stat span:first-child { color: #64748B; }
.breakdown-stat span:last-child { font-weight: 600; color: #1E293B; }

.heat-map-container { overflow-x: auto; }

.heat-map {
  display: grid;
  grid-template-columns: 60px repeat(12, 1fr);
  gap: 2px;
  min-width: 700px;
}

.heat-map-header { font-size: 10px; font-weight: 600; color: #64748B; text-align: center; padding: 8px 4px; }

.heat-map-row-label {
  font-size: 11px;
  font-weight: 500;
  color: #1E293B;
  display: flex;
  align-items: center;
  padding-left: 8px;
}

.heat-cell {
  padding: 10px 4px;
  text-align: center;
  font-size: 11px;
  font-weight: 600;
  border-radius: 4px;
  cursor: pointer;
  transition: transform 0.15s;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.heat-value { font-size: 13px; font-weight: 600; }
.heat-pct { font-size: 9px; opacity: 0.8; margin-top: 2px; }

.heat-cell:hover { transform: scale(1.05); box-shadow: 0 2px 8px rgba(0,0,0,0.15); }

.hide-btn { background: none; border: none; cursor: pointer; padding: 4px; color: #64748B; opacity: 0.5; }
.hide-btn:hover { opacity: 1; }

.theme-analysis-content { padding: 20px; overflow-y: auto; }
.theme-analysis-content h4 { font-size: 14px; font-weight: 600; margin: 16px 0 12px; }
.theme-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.theme-card { background: #F8FAFC; border-radius: 8px; padding: 16px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; }
.theme-card:hover { background: #F1F5F9; }
.theme-name { font-weight: 500; }
.theme-count { background: #0066FF; color: white; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }
.unthemed-list { max-height: 200px; overflow-y: auto; }
.unthemed-item { display: flex; gap: 12px; padding: 8px 0; border-bottom: 1px solid #F1F5F9; font-size: 12px; }
.unthemed-booking { font-weight: 500; min-width: 100px; }
.unthemed-comment { color: #64748B; }
.comment-cell { max-width: 200px; font-size: 10px; color: #64748B; }

.manager-table { width: 100%; border-collapse: collapse; }

.manager-table th {
  text-align: left;
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #64748B;
  font-weight: 600;
  padding: 10px 8px;
  border-bottom: 2px solid #E2E8F0;
  background: #F8FAFC;
}

.manager-table td { padding: 10px 8px; font-size: 11px; border-bottom: 1px solid #E2E8F0; }
.manager-table tr { cursor: pointer; transition: background 0.15s; }
.manager-table tr:hover td { background: #F1F5F9; }
.manager-name { font-weight: 500; color: #1E293B; }

.conversion-badge { display: inline-block; padding: 2px 6px; border-radius: 10px; font-size: 9px; font-weight: 600; }
.conversion-badge.high { background: #D1FAE5; color: #059669; }
.conversion-badge.medium { background: #FEF3C7; color: #D97706; }
.conversion-badge.low { background: #FEE2E2; color: #DC2626; }

.pipeline-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.pipeline-table th {
  text-align: left;
  font-size: 10px;
  text-transform: uppercase;
  color: #64748B;
  font-weight: 600;
  padding: 10px 12px;
  border-bottom: 2px solid #E2E8F0;
  background: #F8FAFC;
}
.pipeline-table td { padding: 10px 12px; border-bottom: 1px solid #E2E8F0; }
.pipeline-table tr { cursor: pointer; transition: background 0.15s; }
.pipeline-table tr:hover td { background: #F1F5F9; }
.pipeline-table tr:last-child { font-weight: 600; background: #F8FAFC; cursor: default; }
.pipeline-table tr:last-child:hover td { background: #F8FAFC; }

.lost-table { width: 100%; border-collapse: collapse; font-size: 11px; }
.lost-table th {
  text-align: left;
  font-size: 9px;
  text-transform: uppercase;
  color: #64748B;
  font-weight: 600;
  padding: 8px 10px;
  border-bottom: 2px solid #E2E8F0;
  background: #F8FAFC;
}
.lost-table td { padding: 8px 10px; border-bottom: 1px solid #E2E8F0; }
.lost-table tr { cursor: pointer; transition: background 0.15s; }
.lost-table tr:hover td { background: #FEF2F2; }

.drill-down-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.drill-down-content {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 1500px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.drill-down-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px 20px;
  border-bottom: 1px solid #E2E8F0;
}

.drill-down-header h3 { font-size: 16px; font-weight: 600; }
.drill-down-summary { font-size: 12px; color: #64748B; margin-top: 4px; }

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #64748B;
  padding: 4px;
  border-radius: 4px;
  flex-shrink: 0;
}

.close-btn:hover { background: #F1F5F9; }

.drill-down-table-wrapper { overflow: auto; flex: 1; }

.drill-down-table { width: 100%; border-collapse: collapse; font-size: 11px; }

.drill-down-table th {
  position: sticky;
  top: 0;
  background: #F8FAFC;
  padding: 10px 8px;
  text-align: left;
  font-weight: 600;
  color: #64748B;
  font-size: 9px;
  text-transform: uppercase;
  border-bottom: 2px solid #E2E8F0;
}

.drill-down-table td { padding: 8px; border-bottom: 1px solid #E2E8F0; }
.drill-down-table tr:hover td { background: #F8FAFC; }

.truncate { max-width: 150px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.status-badge { padding: 2px 8px; border-radius: 10px; font-size: 9px; font-weight: 500; }
.status-badge.actual { background: #D1FAE5; color: #059669; }
.status-badge.definite { background: #DBEAFE; color: #2563EB; }
.status-badge.tentative { background: #FEF3C7; color: #D97706; }
.status-badge.lost { background: #FEE2E2; color: #DC2626; }
.status-badge.turn-down { background: #F1F5F9; color: #64748B; }
.status-badge.cancelled { background: #FCE7F3; color: #DB2777; }

.type-badge { padding: 2px 8px; border-radius: 10px; font-size: 9px; font-weight: 500; }
.type-badge.group { background: #DBEAFE; color: #2563EB; }
.type-badge.catering { background: #D1FAE5; color: #059669; }

.more-records { padding: 12px 20px; text-align: center; color: #64748B; font-size: 12px; border-top: 1px solid #E2E8F0; }

.loading-spinner { display: flex; align-items: center; gap: 12px; color: #0066FF; }
.spinner { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

.clickable { cursor: pointer; }

.mini-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }

/* KPI Detail Modal */
.kpi-detail-modal {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 20px;
}

.kpi-detail-modal h3 { font-size: 18px; font-weight: 600; margin-bottom: 16px; }
.kpi-detail-modal h4 { font-size: 14px; font-weight: 600; margin: 16px 0 8px; color: #64748B; }

.kpi-detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.kpi-detail-stat {
  background: #F8FAFC;
  border-radius: 8px;
  padding: 12px;
  text-align: center;
}

.kpi-detail-stat .stat-value { font-size: 24px; font-weight: 700; color: #1E293B; display: block; }
.kpi-detail-stat .stat-label { font-size: 11px; color: #64748B; }

.kpi-detail-chart { margin-top: 20px; }

/* Manager Deep Dive */
.manager-deep-dive {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 1200px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.manager-header-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.back-btn {
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  color: #64748B;
  font-size: 12px;
}

.back-btn:hover { color: #0066FF; }

.manager-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #0066FF, #00C2FF);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.manager-subtitle { font-size: 12px; color: #64748B; }

.manager-content { padding: 20px; overflow-y: auto; }

.manager-kpi-row {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.manager-kpi {
  background: #F8FAFC;
  border-radius: 8px;
  padding: 12px;
  text-align: center;
}

.manager-kpi-value { font-size: 20px; font-weight: 700; color: #1E293B; display: block; }
.manager-kpi-label { font-size: 10px; color: #64748B; text-transform: uppercase; }
.manager-kpi-compare { font-size: 10px; display: block; margin-top: 4px; }
.manager-kpi-compare.up { color: #10B981; }
.manager-kpi-compare.down { color: #EF4444; }

.manager-charts-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}

.manager-chart-card {
  background: #F8FAFC;
  border-radius: 8px;
  padding: 12px;
}

.manager-chart-card h4 { font-size: 12px; font-weight: 600; margin-bottom: 8px; }
.manager-chart { height: 180px; }

.win-loss-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}

.win-loss-stat {
  text-align: center;
  padding: 12px;
  border-radius: 6px;
}

.win-loss-stat.won { background: #D1FAE5; }
.win-loss-stat.lost { background: #FEE2E2; }
.win-loss-stat.pipeline { background: #FEF3C7; }

.win-loss-value { font-size: 24px; font-weight: 700; display: block; }
.win-loss-label { font-size: 10px; color: #64748B; }

.lost-reasons-list { margin-top: 12px; }
.lost-reasons-list h5 { font-size: 11px; color: #64748B; margin-bottom: 6px; }

.lost-reason-item {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  font-size: 11px;
  border-bottom: 1px solid #E2E8F0;
}

.lost-reason-item:last-child { border-bottom: none; }
.lost-reason-count { font-weight: 600; color: #EF4444; }

@media (max-width: 1400px) {
  .charts-grid { grid-template-columns: 1fr; }
  .chart-card.span-2 { grid-column: span 1; }
  .mini-grid { grid-template-columns: 1fr; }
  .manager-charts-row { grid-template-columns: 1fr; }
  .manager-kpi-row { grid-template-columns: repeat(3, 1fr); }
}

@media (max-width: 768px) {
  .dashboard-header { padding: 12px 16px; }
  .dashboard-content { padding: 16px; }
  .filters-row { gap: 8px; }
  .kpi-grid { grid-template-columns: repeat(2, 1fr); }
  .manager-kpi-row { grid-template-columns: repeat(2, 1fr); }
}
```

`;

return (
<>
<style>{styles}</style>
<div className="dashboard">
<header className="dashboard-header">
<div className="header-content">
<div className="header-top">
<div className="brand">
<h1>Group Booking Analytics</h1>
<span className="brand-subtitle">Alila Ventana Big Sur</span>
</div>
{rawData && (
<div className="header-actions">
<span className="record-badge">{recordCount.toLocaleString()} Leads (excl. internal)</span>
<label className="upload-btn">
<RefreshCw size={14} /> Update Data
<input type="file" className="file-input" accept=".csv" onChange={handleFileUpload} />
</label>
</div>
)}
</div>

```
        {rawData && (
          <div className="filters-row">
            <div className="filter-group">
              <span className="filter-label">Years</span>
              <YearToggles years={years} selected={selectedYears} onChange={setSelectedYears} />
            </div>
            <div className="filter-group">
              <span className="filter-label">Type</span>
              <select className="filter-select" value={selectedBookingCategory} onChange={(e) => setSelectedBookingCategory(e.target.value)}>
                <option value="all">All Types</option>
                <option value="Group Sales">Group Sales</option>
                <option value="Local Catering">Local Catering</option>
              </select>
            </div>
            <div className="filter-group">
              <span className="filter-label">Status</span>
              <select className="filter-select" value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                <option value="all">All Statuses</option>
                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="filter-group">
              <span className="filter-label">Grades</span>
              <GradeToggles grades={grades} selected={selectedGrades} onChange={setSelectedGrades} />
            </div>
            {hasActiveFilters && (
              <button className="clear-filters-btn" onClick={clearAllFilters}>
                <X size={12} /> Clear
              </button>
            )}
          </div>
        )}
      </div>
    </header>

    {segmentDrillDown && (
      <SegmentMonthlyDrillDown 
        year={segmentDrillDown.year} 
        data={segmentDrillDown.data} 
        onClose={() => setSegmentDrillDown(null)} 
      />
    )}
    
    {drillDownBookings && (
      <BookingDrillDown bookings={drillDownBookings} title={drillDownTitle} onClose={() => setDrillDownBookings(null)} showComments={drillDownShowComments} />
    )}
    
    {showThemeAnalysis && (
      <ThemeAnalysisModal bookings={showThemeAnalysis} onClose={() => setShowThemeAnalysis(null)} openDrillDown={openDrillDown} />
    )}
    
    {selectedManager && (
      <ManagerDeepDive 
        manager={selectedManager} 
        bookings={filteredData} 
        teamAvg={analytics?.teamAvg || { leads: 0, convRate: 0, avgResponse: 0 }}
        onClose={() => setSelectedManager(null)} 
      />
    )}
    
    {kpiDetail && analytics && (
      <KPIDetailModal
        type={kpiDetail}
        data={analytics.kpiDetails[kpiDetail]}
        years={years}
        onClose={() => setKpiDetail(null)}
      />
    )}

    {!rawData ? (
      <div className="upload-area">
        <label className={`upload-box ${isLoading ? 'loading' : ''}`}>
          {isLoading ? (
            <div className="loading-spinner">
              <RefreshCw size={28} className="spinner" />
              <span>Processing your data...</span>
            </div>
          ) : (
            <>
              <Upload size={48} className="upload-icon" />
              <h2 className="upload-title">Upload Booking Report</h2>
              <p className="upload-subtitle">Upload your cleaned CSV file to begin analysis</p>
              <span className="btn-primary">
                <Upload size={16} /> Select CSV File
              </span>
            </>
          )}
          <input type="file" className="file-input" accept=".csv" onChange={handleFileUpload} />
        </label>
        {error && (
          <div className="error-box">
            <AlertCircle size={18} color="#DC2626" />
            <p>{error}</p>
          </div>
        )}
      </div>
    ) : analytics && (
      <div className="dashboard-content">
        {/* KPIs - Clickable with YoY variance */}
        <div className="kpi-grid">
          <KPICard title="Total Leads" value={formatNumber(analytics.totalLeads)} icon={Target} yoyVariance={analytics.yoyVariances.leads} />
          <KPICard title="Conversion" value={`${analytics.conversionRate}%`} icon={TrendingUp} clickable onClick={() => setKpiDetail('conversion')} yoyVariance={analytics.yoyVariances.conversion} />
          <KPICard title="Converted" value={analytics.convertedCount} icon={Users} yoyVariance={analytics.yoyVariances.converted} />
          <KPICard title="Room Nights" value={formatNumber(analytics.totalRoomNights)} icon={Calendar} clickable onClick={() => setKpiDetail('roomNights')} yoyVariance={analytics.yoyVariances.roomNights} />
          <KPICard title="Group Revenue" value={formatCurrency(analytics.totalRevenue)} icon={DollarSign} yoyVariance={analytics.yoyVariances.groupRevenue} />
          <KPICard title="Event Revenue" value={formatCurrency(analytics.totalEventRevenue)} icon={DollarSign} yoyVariance={analytics.yoyVariances.eventRevenue} />
          <KPICard title="F&B Revenue" value={formatCurrency(analytics.totalFnBRevenue)} icon={DollarSign} yoyVariance={analytics.yoyVariances.fnbRevenue} />
          <KPICard title="Rental Revenue" value={formatCurrency(analytics.totalRentalRevenue)} icon={Building2} yoyVariance={analytics.yoyVariances.rentalRevenue} />
          <KPICard title="Avg Lead Time" value={`${analytics.avgLeadTime}d`} icon={Clock} clickable onClick={() => setKpiDetail('leadTime')} yoyVariance={analytics.yoyVariances.leadTime} />
          <KPICard title="Avg Response" value={`${analytics.avgResponseTime}h`} icon={Clock} clickable onClick={() => setKpiDetail('response')} yoyVariance={analytics.yoyVariances.responseTime} />
          <KPICard title="Spend/Group RN" value={formatCurrency(analytics.spendPerGroupRN)} icon={BarChart3} subtitle="Event Rev ÷ Group RN" yoyVariance={analytics.yoyVariances.spendPerRN} />
          <KPICard title="Pipeline" value={analytics.tentativeCount} icon={Building2} yoyVariance={analytics.yoyVariances.pipeline} />
        </div>

        {/* Group vs Local Catering */}
        <h3 className="section-title">Group Sales vs Local Catering</h3>
        <div className="chart-card">
          <WidgetHeader
            title="Revenue Breakdown by Booking Type"
            subtitle="Click card to view bookings"
            years={years}
            selectedYears={groupCateringYears}
            onYearChange={setGroupCateringYears}
            showYears={true}
          />
          <div className="revenue-breakdown-grid">
            <div className="breakdown-card" onClick={() => openDrillDown(analytics.groupVsCatering.group.bookings, 'Group Sales Bookings')}>
              <h4><span className="badge group">Group Sales</span> Revenue Breakdown</h4>
              <div className="breakdown-stat"><span>Bookings</span><span>{analytics.groupVsCatering.group.count}</span></div>
              <div className="breakdown-stat"><span>Room Nights</span><span>{formatNumber(analytics.groupVsCatering.group.roomNights)}</span></div>
              <div className="breakdown-stat"><span>Group Revenue</span><span>{formatCurrency(analytics.groupVsCatering.group.groupRevenue)}</span></div>
              <div className="breakdown-stat"><span>Event Revenue</span><span>{formatCurrency(analytics.groupVsCatering.group.eventRevenue)}</span></div>
              <div className="breakdown-stat"><span>F&B Revenue</span><span>{formatCurrency(analytics.groupVsCatering.group.fnbRevenue)}</span></div>
              <div className="breakdown-stat"><span>Meeting Room Rental</span><span>{formatCurrency(analytics.groupVsCatering.group.rentalRevenue)}</span></div>
            </div>
            <div className="breakdown-card" onClick={() => openDrillDown(analytics.groupVsCatering.catering.bookings, 'Local Catering Bookings')}>
              <h4><span className="badge catering">Local Catering</span> Revenue Breakdown</h4>
              <div className="breakdown-stat"><span>Bookings</span><span>{analytics.groupVsCatering.catering.count}</span></div>
              <div className="breakdown-stat"><span>Room Nights</span><span>{formatNumber(analytics.groupVsCatering.catering.roomNights)}</span></div>
              <div className="breakdown-stat"><span>Group Revenue</span><span>{formatCurrency(analytics.groupVsCatering.catering.groupRevenue)}</span></div>
              <div className="breakdown-stat"><span>Event Revenue</span><span>{formatCurrency(analytics.groupVsCatering.catering.eventRevenue)}</span></div>
              <div className="breakdown-stat"><span>F&B Revenue</span><span>{formatCurrency(analytics.groupVsCatering.catering.fnbRevenue)}</span></div>
              <div className="breakdown-stat"><span>Meeting Room Rental</span><span>{formatCurrency(analytics.groupVsCatering.catering.rentalRevenue)}</span></div>
            </div>
          </div>
        </div>

        {/* Event Revenue by Year */}
        <h3 className="section-title">Event Revenue Analysis</h3>
        <div className="chart-card">
          <WidgetHeader 
            title="Event Revenue by Year" 
            subtitle="F&B vs Meeting Room Rental breakdown"
            years={years}
            selectedYears={eventRevenueYears}
            onYearChange={setEventRevenueYears}
            showYears={true}
          />
          <div className="chart-content">
            <ResponsiveContainer>
              <BarChart data={analytics.eventRevenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="year" tick={{ fill: '#64748B', fontSize: 11 }} />
                <YAxis tick={{ fill: '#64748B', fontSize: 10 }} tickFormatter={v => formatCurrency(v)} />
                <Tooltip content={<CustomTooltip />} formatter={v => formatCurrency(v)} />
                <Legend />
                <Bar dataKey="fnb" name="F&B Revenue" fill={COLORS.fnb} radius={[4, 4, 0, 0]} />
                <Bar dataKey="rental" name="Meeting Room Rental" fill={COLORS.rental} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Volume */}
        <h3 className="section-title">Lead Analysis</h3>
        <div className="charts-grid">
          <div className="chart-card span-2">
            <WidgetHeader 
              title="Lead Volume by Month" 
              subtitle="Each bar represents a year"
              years={years}
              selectedYears={leadVolumeYears}
              onYearChange={setLeadVolumeYears}
              showYears={true}
            />
            <div className="chart-content tall">
              <ResponsiveContainer>
                <BarChart data={analytics.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="month" tick={{ fill: '#64748B', fontSize: 10 }} tickLine={false} />
                  <YAxis tick={{ fill: '#64748B', fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  {leadVolumeYears.map((year, idx) => (
                    <Bar 
                      key={year}
                      dataKey={`y${year}`} 
                      name={String(year)} 
                      fill={COLORS.yearColors[year] || COLORS.chartColors[idx % COLORS.chartColors.length]}
                      radius={[4, 4, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {analytics.leadGrowthByMonth.length > 0 && (
            <div className="chart-card span-2">
              <WidgetHeader 
                title={`Lead Growth: ${leadVolumeYears[0]} vs ${leadVolumeYears[1]}`}
                subtitle="Month-over-month percentage change"
                showYears={false}
              />
              <div className="chart-content tall">
                <ResponsiveContainer>
                  <BarChart data={analytics.leadGrowthByMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="month" tick={{ fill: '#64748B', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#64748B', fontSize: 10 }} tickFormatter={v => `${v}%`} />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === 'growth') return [`${value}%`, 'Growth'];
                        return [value, name];
                      }}
                    />
                    <Bar dataKey="growth" name="Growth %" fill={COLORS.primary} radius={[4, 4, 0, 0]}>
                      {analytics.leadGrowthByMonth.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.growth >= 0 ? COLORS.success : COLORS.danger} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="chart-card span-2">
            <WidgetHeader 
              title="Year-over-Year Lead Volume" 
              subtitle="Toggle years to compare"
              years={years}
              selectedYears={yoyYears}
              onYearChange={setYoyYears}
              showYears={true}
            />
            <div className="chart-content tall">
              <ResponsiveContainer>
                <LineChart data={analytics.yoyComparison}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="monthName" tick={{ fill: '#64748B', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#64748B', fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  {yoyYears.map((year, idx) => (
                    <Line 
                      key={year} 
                      type="monotone" 
                      dataKey={`y${year}`} 
                      name={String(year)} 
                      stroke={COLORS.yearColors[year] || COLORS.chartColors[idx % COLORS.chartColors.length]}
                      strokeWidth={2}
                      dot={{ r: 3, fill: COLORS.yearColors[year] || COLORS.chartColors[idx % COLORS.chartColors.length] }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Market Segmentation */}
        <h3 className="section-title">Market Segmentation</h3>
        <div className="chart-card">
          <WidgetHeader 
            title="Corporate vs Social Lead Distribution" 
            subtitle="Click any pie chart to see monthly breakdown"
            years={years}
            selectedYears={segmentYears}
            onYearChange={setSegmentYears}
            showYears={true}
          />
          <div className="segment-pies">
            {analytics.segmentComparison.map(yearData => (
              <div 
                key={yearData.year} 
                className="segment-pie" 
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  const yearData = rawData.filter(d => d.arrivalYear === yearData.year);
                  setSegmentDrillDown({ year: yearData.year, data: yearData });
                }}
              >
                <h4>{yearData.year}</h4>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Corporate', value: yearData.Corporate, pct: yearData.corporatePct },
                        { name: 'Social', value: yearData.Social, pct: yearData.socialPct }
                      ]}
                      cx="50%" cy="50%"
                      innerRadius={30} outerRadius={60}
                      dataKey="value"
                      label={({ pct }) => `${pct}%`}
                      labelLine={false}
                    >
                      <Cell fill={COLORS.corporate} />
                      <Cell fill={COLORS.social} />
                    </Pie>
                    <Tooltip formatter={(value, name, props) => [`${props.payload.pct}% (${value})`, name]} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ fontSize: '10px', color: '#64748B' }}>
                  <span style={{ color: COLORS.corporate }}>■</span> Corp: {yearData.corporatePct}% | 
                  <span style={{ color: COLORS.social, marginLeft: '6px' }}>■</span> Social: {yearData.socialPct}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lead Time */}
        <h3 className="section-title">Lead Time Analysis</h3>
        <div className="chart-card">
          <WidgetHeader 
            title="Lead Time Distribution by Year" 
            subtitle="Days between inquiry and arrival"
            years={years}
            selectedYears={leadTimeYears}
            onYearChange={setLeadTimeYears}
            segment={leadTimeSegment}
            onSegmentChange={setLeadTimeSegment}
            showYears={true}
            showSegment={true}
          />
          <div className="chart-content tall">
            <ResponsiveContainer>
              <AreaChart data={analytics.leadTimeComparison}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="range" tick={{ fill: '#64748B', fontSize: 10 }} />
                <YAxis tick={{ fill: '#64748B', fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {leadTimeYears.map((year, idx) => (
                  <Area 
                    key={year}
                    type="monotone" 
                    dataKey={`y${year}`} 
                    name={String(year)} 
                    stroke={COLORS.yearColors[year] || COLORS.chartColors[idx]}
                    fill={COLORS.yearColors[year] || COLORS.chartColors[idx]}
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Peak Demand */}
        <h3 className="section-title">Peak Demand Analysis</h3>
        <div className="chart-card">
          <WidgetHeader 
            title="Booking Distribution by Arrival Month" 
            subtitle="Click any cell to drill down. Each year sums to 100%."
            years={allYearsForHeatMap}
            selectedYears={heatMapYears}
            onYearChange={setHeatMapYears}
            grades={grades}
            selectedGrades={heatMapGrades}
            onGradeChange={setHeatMapGrades}
            segment={heatMapSegment}
            onSegmentChange={setHeatMapSegment}
            showYears={true}
            showGrades={true}
            showSegment={true}
          />
          <div className="heat-map-container">
            <div className="heat-map">
              <div className="heat-map-header"></div>
              {MONTH_NAMES.map(m => <div key={m} className="heat-map-header">{m}</div>)}
              
              {Object.entries(analytics.arrivalHeatMap).sort((a, b) => parseInt(a[0]) - parseInt(b[0])).map(([year, months]) => {
                const yearTotal = analytics.yearTotals[year] || 1;
                const percentages = Object.values(months).map(arr => (arr.length / yearTotal) * 100);
                const maxPct = Math.max(...percentages, 1);
                
                return (
                  <React.Fragment key={year}>
                    <div className="heat-map-row-label">{year}</div>
                    {Object.entries(months).sort((a, b) => parseInt(a[0]) - parseInt(b[0])).map(([month, bookings]) => {
                      const count = bookings.length;
                      const pct = ((count / yearTotal) * 100).toFixed(1);
                      return (
                        <HeatMapCell 
                          key={`${year}-${month}`} 
                          value={count} 
                          max={yearTotal * (maxPct / 100)}
                          pctOfTotal={pct}
                          onClick={() => handleHeatMapClick(parseInt(year), parseInt(month), bookings)}
                        />
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>

        {/* Block Size */}
        <h3 className="section-title">Block Size Analysis</h3>
        <div className="mini-grid">
          <div className="chart-card">
            <WidgetHeader 
              title="Peak Room Night Distribution" 
              subtitle="Click bars to drill down"
              years={years}
              selectedYears={blockSizeYears}
              onYearChange={setBlockSizeYears}
              grades={grades}
              selectedGrades={blockSizeGrades}
              onGradeChange={setBlockSizeGrades}
              showYears={true}
              showGrades={true}
            />
            <div className="chart-content">
              <ResponsiveContainer>
                <BarChart data={analytics.blockSizeAnalysis} onClick={(e) => {
                  if (e?.activePayload?.[0]?.payload?.bookings?.length > 0) {
                    openDrillDown(e.activePayload[0].payload.bookings, `Block Size: ${e.activePayload[0].payload.label}`);
                  }
                }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="label" tick={{ fill: '#64748B', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#64748B', fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Bookings" fill={COLORS.primary} radius={[4, 4, 0, 0]} className="clickable" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-card">
            <WidgetHeader 
              title="Revenue by Block Size" 
              subtitle="Click bars to drill down"
              years={years}
              selectedYears={blockSizeYears}
              onYearChange={setBlockSizeYears}
              grades={grades}
              selectedGrades={blockSizeGrades}
              onGradeChange={setBlockSizeGrades}
              showYears={true}
              showGrades={true}
            />
            <div className="chart-content">
              <ResponsiveContainer>
                <BarChart data={analytics.blockSizeAnalysis} onClick={(e) => {
                  if (e?.activePayload?.[0]?.payload?.bookings?.length > 0) {
                    openDrillDown(e.activePayload[0].payload.bookings, `Block Size: ${e.activePayload[0].payload.label}`);
                  }
                }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="label" tick={{ fill: '#64748B', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#64748B', fontSize: 10 }} tickFormatter={v => formatCurrency(v)} />
                  <Tooltip content={<CustomTooltip />} formatter={v => formatCurrency(v)} />
                  <Bar dataKey="revenue" name="Revenue" fill={COLORS.success} radius={[4, 4, 0, 0]} className="clickable" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Sales Manager Performance - Whitney & Anna only */}
        <h3 className="section-title">Sales Manager Performance (Whitney & Anna)</h3>
        <div className="chart-card">
          <WidgetHeader title="Performance by Manager" subtitle="Click row for deep dive analysis" showYears={false} />
          <table className="manager-table">
            <thead>
              <tr>
                <th>Sales Manager</th>
                <th>Leads</th>
                <th>Converted</th>
                <th>Conv %</th>
                <th>Room Nights</th>
                <th>Group Rev</th>
                <th>Event Rev</th>
                <th>Avg Rate</th>
                <th>Avg Response</th>
              </tr>
            </thead>
            <tbody>
              {analytics.managerPerformance.map((mgr, idx) => (
                <tr key={idx} onClick={() => setSelectedManager(mgr.manager)}>
                  <td className="manager-name">{mgr.manager}</td>
                  <td>{mgr.leads}</td>
                  <td>{mgr.converted}</td>
                  <td>
                    <span className={`conversion-badge ${mgr.conversionRate >= 15 ? 'high' : mgr.conversionRate >= 8 ? 'medium' : 'low'}`}>
                      {mgr.conversionRate}%
                    </span>
                  </td>
                  <td>{formatNumber(mgr.roomNights)}</td>
                  <td>{formatCurrency(mgr.revenue)}</td>
                  <td>{formatCurrency(mgr.eventRevenue)}</td>
                  <td>{formatCurrency(mgr.avgRate)}</td>
                  <td>{mgr.avgResponseTime}h</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pipeline Snapshot */}
        <h3 className="section-title">Pipeline Snapshot (Tentative by Grade)</h3>
        <div className="chart-card">
          <WidgetHeader title="Tentative Bookings by Grade" subtitle="Click row to view bookings" showYears={false} />
          <table className="pipeline-table">
            <thead>
              <tr>
                <th>Grade</th>
                <th>Count</th>
                <th>Room Nights</th>
                <th>Group Revenue</th>
                <th>Event Revenue</th>
                <th>Total Revenue</th>
              </tr>
            </thead>
            <tbody>
              {analytics.pipelineSnapshot.map((g, idx) => (
                <tr key={idx} onClick={() => openDrillDown(g.bookings, `Pipeline: ${g.grade}`)}>
                  <td>{g.grade}</td>
                  <td>{g.count}</td>
                  <td>{formatNumber(g.roomNights)}</td>
                  <td>{formatCurrency(g.revenue)}</td>
                  <td>{formatCurrency(g.eventRevenue)}</td>
                  <td>{formatCurrency(g.revenue + g.eventRevenue)}</td>
                </tr>
              ))}
              <tr>
                <td>TOTAL</td>
                <td>{analytics.pipelineSnapshot.reduce((s, g) => s + g.count, 0)}</td>
                <td>{formatNumber(analytics.pipelineSnapshot.reduce((s, g) => s + g.roomNights, 0))}</td>
                <td>{formatCurrency(analytics.pipelineSnapshot.reduce((s, g) => s + g.revenue, 0))}</td>
                <td>{formatCurrency(analytics.pipelineSnapshot.reduce((s, g) => s + g.eventRevenue, 0))}</td>
                <td>{formatCurrency(analytics.pipelineSnapshot.reduce((s, g) => s + g.revenue + g.eventRevenue, 0))}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Lost & Turn Down Analysis - YoY Comparison */}
        <h3 className="section-title">Lost & Turn Down Analysis</h3>
        <div className="chart-card">
          <WidgetHeader 
            title="Lost/TD Reasons by Year" 
            subtitle="Click row to view bookings. Click eye icon to hide/show reasons for screenshots."
            years={years}
            selectedYears={lostYears}
            onYearChange={setLostYears}
            showYears={true}
          />
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <table className="lost-table">
              <thead>
                <tr>
                  <th style={{ width: '30px' }}></th>
                  <th>Reason</th>
                  {lostYears.map(y => <th key={y}>{y}</th>)}
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {analytics.lostAnalysis.filter(r => !hiddenLostReasons.includes(r.reason)).map((r, idx) => {
                  const isOtherC = r.reason.toLowerCase().includes('other') && (r.reason.toLowerCase().includes('c-comment') || r.reason.toLowerCase().includes('c comment') || r.reason.toLowerCase().includes('c-comments'));
                  return (
                    <tr key={idx} onClick={() => isOtherC ? setShowThemeAnalysis(r.bookings) : openDrillDown(r.bookings, `Lost: ${r.reason}`, true)}>
                      <td onClick={(e) => { e.stopPropagation(); toggleHiddenReason(r.reason); }}>
                        <button className="hide-btn" title="Hide this reason">
                          {hiddenLostReasons.includes(r.reason) ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </td>
                      <td className="truncate" style={{ maxWidth: '200px' }}>
                        {r.reason}
                        {isOtherC && <span style={{ fontSize: '9px', color: '#0066FF', marginLeft: '4px' }}>(click for theme analysis)</span>}
                      </td>
                      {lostYears.map(y => <td key={y}>{r[`y${y}`] || 0}</td>)}
                      <td style={{ fontWeight: 600 }}>{r.total}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {hiddenLostReasons.length > 0 && (
            <div style={{ marginTop: '12px', padding: '8px', background: '#FEF3C7', borderRadius: '6px', fontSize: '11px' }}>
              <strong>{hiddenLostReasons.length} reason(s) hidden.</strong> 
              <button onClick={() => setHiddenLostReasons([])} style={{ marginLeft: '8px', background: 'none', border: 'none', color: '#0066FF', cursor: 'pointer', textDecoration: 'underline' }}>
                Show all
              </button>
            </div>
          )}
        </div>
      </div>
    )}
  </div>
</>
```

);
}
