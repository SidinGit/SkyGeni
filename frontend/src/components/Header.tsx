import { AppBar, Toolbar, Box, IconButton, Badge } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ChatIcon from '@mui/icons-material/Chat';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import DashboardIcon from '@mui/icons-material/Dashboard';

export default function Header() {
    return (
        <AppBar position="static" sx={{ bgcolor: '#1e3a5f', boxShadow: 'none' }}>
            <Toolbar sx={{ minHeight: 40 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ height: 32, display: 'flex' }}>
                        <img
                            src="https://cdn.prod.website-files.com/67d05b82be5809e1bcda501d/6822ba76af86f212e67a4c94_SkyGeniLogo-p-500.png"
                            alt="SkyGeni"
                            style={{ height: '100%', width: 'auto' }}
                        />
                    </Box>
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
