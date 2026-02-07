import { AppBar, Toolbar, Typography, Box, IconButton, Badge } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ChatIcon from '@mui/icons-material/Chat';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import DashboardIcon from '@mui/icons-material/Dashboard';

export default function Header() {
    return (
        <AppBar position="static" sx={{ bgcolor: '#1e3a5f', boxShadow: 'none' }}>
            <Toolbar sx={{ minHeight: 40 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                        sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Typography sx={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>
                            <img src="https://assets.codepen.io/1692350/skygeni_logo.png" style={{ width: 20, height: 20 }} alt="logo" />
                        </Typography>
                    </Box>
                    <Typography variant="h6" component="div" sx={{ fontWeight: 700, fontSize: '1.25rem' }}>
                        SkyGeni
                    </Typography>
                </Box>

                <Box sx={{ flexGrow: 1 }} />

                <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton color="inherit" size="small">
                        <DashboardIcon />
                    </IconButton>
                    <IconButton color="inherit" size="small">
                        <Badge badgeContent={3} color="error" sx={{ '& .MuiBadge-badge': { fontSize: 9, height: 16, minWidth: 16 } }}>
                            <NotificationsIcon />
                        </Badge>
                    </IconButton>
                    <IconButton color="inherit" size="small">
                        <ChatIcon />
                    </IconButton>
                    <IconButton color="inherit" size="small">
                        <AccountCircleIcon />
                    </IconButton>
                </Box>
            </Toolbar>
        </AppBar>
    );
}
