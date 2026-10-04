const express = require('express');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const customer_routes = require('./router/auth_users.js').authenticated;
const genl_routes = require('./router/general.js').general;

const app = express();

app.use(express.json());

// set up sessions for the customer routes(middleware)
app.use("/customer", session({
    secret: "fingerprint_customer",
    resave: true,
    saveUninitialized: true
}));

app.use("/customer/auth/*", function auth(req, res, next) {
    // {check if the user is authorized
    if (req.session && req.session.authorization) {
        const token = req.session.authorization['accessToken']; // access the access token from the session,

        jwt.verify(token, "access", (err, user) => {
            if (!err) {
                req.user = user;
                next();
            } else {
                return res.status(403).json({ message: "User not authorized" });
            }
        });
    } else if (req.headers['authorization']) {
        const authHeader = req.headers['authorization'];
        const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : authHeader.trim();

        jwt.verify (token, "access", (err, user) => {
            if (!err) {
                req.user = user;
                if (req.session) {
                    req.session.authorization = {
                        accessToken: token,
                        username: user.username || user.data
                    };
                    next();
                } else {
                    return res.status(403).json({ message: "User not authenticated: Invalid or expired token" });
                }
            } else {
                return res.status(403).json({ message: "User not authorized" });
            }
        });
    }
});

const PORT = 8080;

app.use("/customer", customer_routes);
app.use("/", genl_routes);

app.listen(PORT, () => console.log("Server is running"));
