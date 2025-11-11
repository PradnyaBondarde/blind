import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import GuardianLogin from '../pages/guardian/GuardianLogin';
import GuardianSignup from '../pages/guardian/GuardianSignup';
import GuardianHome from '../pages/guardian/GuardianHome';
import PendingConnections from '../pages/guardian/PendingConnections';

import GuardianProfileView from '../pages/guardian/GuardianProfileView';
import ConnectionRequest from '../pages/guardian/ConnectionRequest';
import ConnectedUsers from '../pages/guardian/ConnectedUsers';
import BlindLogin from '../pages/blind/BlindLogin';
import BlindSignup from '../pages/blind/BlindSignup';

import RoleSelection from '../pages/RoleSelection';

const AppRouter = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<RoleSelection />} />
                
                {/* Guardian Routes */}
                <Route path="/guardian/login" element={<GuardianLogin />} />
                <Route path="/guardian/signup" element={<GuardianSignup />} />
                <Route path="/guardian/home" element={<GuardianHome />} />
                <Route path="/guardian/viewprofile" element={<GuardianProfileView />} />
                <Route path="/guardian/request/:requestId" element={<ConnectionRequest />} />
                <Route path="/guardian/connected-users" element={<ConnectedUsers />} />
                <Route path="/guardian/pending-connections" element={<PendingConnections />} />

                {/* Blind User Routes */}
                <Route path="/blind/login" element={<BlindLogin />} />
                <Route path="/blind/signup" element={<BlindSignup />} />
                
            </Routes>
        </Router>
    );
};

export default AppRouter;