import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Navigation from '../../components/Navigation/Navigation.jsx';
import { orderService } from '../../services/api';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar, Tooltip } from 'recharts';
import './Dashboard.css';

function Dashboard() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [monthRevenue, setMonthRevenue] = useState(0);
  const [todayOrderCount, setTodayOrderCount] = useState(0);
  const [weeklySalesTrend, setWeeklySalesTrend] = useState([]);
  const [topItems, setTopItems] = useState([]);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!token) return;
      setLoading(true);
      try {
        const allOrders = await orderService.getOrders({}, token);
        const ordersArray = Array.isArray(allOrders) ? allOrders : [];

        const now = new Date();
        const choicesLocaleOptions = { year: 'numeric', month: '2-digit', day: '2-digit' };
        const todayString = now.toLocaleDateString('en-CA', choicesLocaleOptions); // "YYYY-MM-DD"
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        let revenueTodayAccumulator = 0;
        let revenueMonthAccumulator = 0;
        let ordersTodayAccumulator = 0;

        ordersArray.forEach(order => {
          const orderDate = new Date(order.dateAndTime || order.createdAt);
          const orderDateString = orderDate.toLocaleDateString('en-CA', choicesLocaleOptions);
          const orderTotal = parseFloat(order.total || 0);

          // Today 
          if (orderDateString === todayString) {
            revenueTodayAccumulator += orderTotal;
            ordersTodayAccumulator += 1;
          }

          // Month 
          if (orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear) {
            revenueMonthAccumulator += orderTotal;
          }
        });

        setTodayRevenue(revenueTodayAccumulator);
        setMonthRevenue(revenueMonthAccumulator);
        setTodayOrderCount(ordersTodayAccumulator);

        // 7 Days Sales Trend 
        const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const trendMap = {};

        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(now.getDate() - i);
          const dateStr = d.toLocaleDateString('en-CA', choicesLocaleOptions);
          trendMap[dateStr] = {
            day: daysOfWeek[d.getDay()],
            sales: 0,
            sortKey: d.getTime()
          };
        }

        // Map order amounts directly to dates
        ordersArray.forEach(order => {
          const orderDate = new Date(order.dateAndTime || order.createdAt);
          const dateStr = orderDate.toLocaleDateString('en-CA', choicesLocaleOptions);
          if (trendMap[dateStr]) {
            trendMap[dateStr].sales += parseFloat(order.total || 0);
          }
        });

        const formattedTrend = Object.values(trendMap).sort((a, b) => a.sortKey - b.sortKey);
        setWeeklySalesTrend(formattedTrend);

        const productCounter = {};
        ordersArray.forEach(order => {
          if (order.items && Array.isArray(order.items)) {
            order.items.forEach(item => {
              const name = item.productName || 'Unknown Item';
              const qty = parseInt(item.quantity || 0, 10);
              productCounter[name] = (productCounter[name] || 0) + qty;
            });
          }
        });

        const formattedTopItems = Object.keys(productCounter).map(name => ({
          name: name,
          value: productCounter[name]
        }))
        .sort((a, b) => b.value - a.value) 
        .slice(0, 5); 

        setTopItems(formattedTopItems.length > 0 ? formattedTopItems : [
          { name: 'No Sales Yet', value: 0 }
        ]);

      } catch (err) {
        console.error('Error computing dashboard real-time data metrics:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [token]);

  const maxTrendValue = Math.max(...weeklySalesTrend.map(d => d.sales), 50);
  const maxItemCount = Math.max(...topItems.map(i => i.value), 2);

  return (
    <div className="dashboard-container">
      <Navigation />
      
      <main className="dashboard-main">
        <header className="dashboard-header">
          <h1>Dashboard</h1>
          {loading && <span className="updating-indicator">Refreshing live statistics...</span>}
        </header>

        <div className="dashboard-grid">
          {/* LEFT SIDE COLUMN */}
          <div className="left-column">
            {/* Top Revenue Stat Block */}
            <div className="revenue-row">
              <div className="dashboard-card">
                <div className="card-top">
                  <span className="card-title">Today's<br />Revenue</span>
                  <span className="card-icon" style={{color: '#3B5323'}}>₱</span>
                </div>
                <h2 className="card-value">₱{todayRevenue.toFixed(2)}</h2>
              </div>

              <div className="dashboard-card">
                <div className="card-top">
                  <span className="card-title">This month's<br />Revenue</span>
                  <span className="card-icon" style={{color: '#3B5323'}}>₱</span>
                </div>
                <h2 className="card-value">₱{monthRevenue.toFixed(2)}</h2>
              </div>
            </div>

            {/* Sales Trend Spline Graph Card */}
            <div className="dashboard-card chart-card">
              <div className="card-top" style={{ justifyContent: 'center', marginBottom: '20px' }}>
                <span className="card-title">Sales Trend (Last 7 Days)</span>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={weeklySalesTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3E3126" vertical={false} />
                  <XAxis dataKey="day" stroke="#8C827A" tickLine={false} />
                  <YAxis stroke="#8C827A" tickLine={false} domain={[0, Math.ceil(maxTrendValue * 1.2)]} />
                  <Tooltip formatter={(value) => [`₱${parseFloat(value).toFixed(2)}`, 'Sales']} />
                  <Area type="monotone" dataKey="sales" stroke="#A3C986" strokeWidth={3} fill="rgba(163, 201, 134, 0.08)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* RIGHT SIDE COLUMN */}
          <div className="right-column">
            {/* Top Selling Items Bar Graph */}
            <div className="dashboard-card chart-card">
              <div className="card-top" style={{ justifyContent: 'center', marginBottom: '20px' }}>
                <span className="card-title">Top Selling Items</span>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topItems} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3E3126" horizontal={true} vertical={false} />
                  <XAxis dataKey="name" stroke="#8C827A" tickLine={false} />
                  <YAxis stroke="#8C827A" tickLine={false} allowDecimals={false} domain={[0, Math.ceil(maxItemCount * 1.1)]} />
                  <Tooltip formatter={(value) => [value, 'Units Sold']} />
                  <Bar dataKey="value" fill="#A3C986" radius={[5, 5, 0, 0]} barSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Bottom Mini Utility Status Blocks */}
            <div className="bottom-cards-row">
              <div className="dashboard-card small-card">
                <div className="card-top">
                  <span className="card-title">Stock<br />Alerts</span>
                  <div className="checkmark-icon">✓</div>
                </div>
                <span className="status-text">All Stocks accounted for!</span>
              </div>

              <div className="dashboard-card small-card">
                <div className="card-top">
                  <span className="card-title">Orders<br />Today</span>
                  <span className="card-icon" style={{color: '#A3C986'}}>🛒</span>
                </div>
                <h2 className="card-value">{todayOrderCount}</h2>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
