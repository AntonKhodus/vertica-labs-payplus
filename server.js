import Core from "./core.js";
import express from "express";
const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

// Endpoint that receives Order data when it gets paid (order/paid shopify webhook)
app.post('/paid', async (req, res) => {
    const order_id = req.body.id;
    const core = new Core();
    try {
        const data = await core.syncOrderData(order_id);
        if(data.message === "success"){
            res.sendStatus(200);
        }
    } catch (error) {
        console.error(error);
        res.sendStatus(500);        
    }
})

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`)
})