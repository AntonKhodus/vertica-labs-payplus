import Core from "./core.js";
import express from "express";
const app = express();
const core = new Core();
const PORT = process.env.PORT || 5000;
const MANUAL = process.env.ALLOW_MANUAL || "false";

app.use(express.json());

app.get("/", (req, res) => {
    res.send("You are not supposed to be here. Please leave");
});

// Test endpoint to manualy add payplus notes to order
app.get('/manual/:id', async (req, res) => {
    const order_id = req.params.id;
    if(MANUAL === "true"){
        try {
            const data = await core.syncOrderData(order_id);
            if(data.message === "success"){
                res.sendStatus(200);
            }
        } catch (error) {
            console.error(error);
            res.sendStatus(500);        
        }
    } else if(MANUAL === "false") {
        console.error('Manual endpoind is disabled. Check your ALLOW_MANUAL environment variable');
        res.sendStatus(404);
    } else {
        console.error('Environment variable ALLOW_MANUAL is not set correctly. It should be either "true" or "false"');
        res.sendStatus(500);
    }
});

// Endpoint that receives Order data when it gets paid (order/paid shopify webhook)
app.post('/paid', async (req, res) => {
    const order_id = req.body.id;
    try {
        const data = await core.syncOrderData(order_id);
        if(data.message === "success"){
            res.sendStatus(200);
        }
    } catch (error) {
        console.error(error);
        res.sendStatus(500);        
    }
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
})