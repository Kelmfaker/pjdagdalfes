import React, { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, Grid, Typography, CircularProgress } from '@mui/material';
import { Line } from 'react-chartjs-2';
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function StatCard({ title, value }) {
	return (
		<Card>
			<CardContent>
				<Typography variant="subtitle2" color="textSecondary">{title}</Typography>
				<Typography variant="h5">{value}</Typography>
			</CardContent>
		</Card>
	)
}

export default function Dashboard() {
	const [stats, setStats] = useState(null);
	const [loading, setLoading] = useState(false);
	const [trend, setTrend] = useState(null);
	const { user } = useAuth();

	async function fetchStats() {
		setLoading(true);
		try {
			const data = await api.request('/admin/stats');
			setStats(data);
		} catch (err) {
			console.error(err);
		} finally { setLoading(false); }
	}

	async function fetchTrend() {
		try {
			// fetch attendance records and aggregate by date (last 7 days)
			const records = await api.request('/attendance');
			const now = new Date();
			const labels = [];
			const counts = [];
			for (let i = 6; i >= 0; i--) {
				const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
				const key = d.toISOString().slice(0,10);
				labels.push(key);
				counts.push(records.filter(r => {
					if (!r.recordedAt) return false;
					const rdate = new Date(r.recordedAt).toISOString().slice(0,10);
					return rdate === key;
				}).length);
			}
			setTrend({ labels, counts });
		} catch (err) {
			console.error('trend error', err);
		}
	}

	useEffect(() => { if (user) { fetchStats(); fetchTrend(); } }, [user]);

	if (!user) {
		return <div style={{ padding: 20 }}>Please login to view the dashboard.</div>
	}

	return (
		<div style={{ padding: 20 }}>
			<Typography variant="h4" gutterBottom>Dashboard</Typography>
			{loading && <CircularProgress />}

			{stats && (
				<Grid container spacing={2}>
					<Grid item xs={12} sm={6} md={3}><StatCard title="Total Members" value={stats.totalMembers} /></Grid>
					<Grid item xs={12} sm={6} md={3}><StatCard title="Active Members" value={stats.activeMembers} /></Grid>
					<Grid item xs={12} sm={6} md={3}><StatCard title="Members with ID" value={stats.membersWithId} /></Grid>
					<Grid item xs={12} sm={6} md={3}><StatCard title="Upcoming Activities" value={stats.upcomingActivities} /></Grid>

					<Grid item xs={12} md={8}>
						<Card>
							<CardContent>
								<Typography variant="h6">Attendance (last 7 days)</Typography>
								{trend ? (
									<Line data={{ labels: trend.labels, datasets: [{ label: 'Attendance', data: trend.counts, borderColor: 'rgba(75,192,192,1)', backgroundColor: 'rgba(75,192,192,0.2)' }] }} />
								) : (<div>Loading chart...</div>)}
							</CardContent>
						</Card>
					</Grid>

					<Grid item xs={12} md={4}>
						<Card>
							<CardContent>
								<Typography variant="h6">Quick Stats</Typography>
								<Typography>Total attendance records: {stats.totalAttendance}</Typography>
								<Typography>Attendance today: {stats.attendanceToday}</Typography>
								<Typography>Total activities: {stats.totalActivities}</Typography>
							</CardContent>
						</Card>
					</Grid>
				</Grid>
			)}
		</div>
	)
}
