import PayPlus from "./payplus-api.js";
import {Shopify, DataType} from '@shopify/shopify-api';
import 'dotenv/config';

export default class Core{
    constructor(){
        this.shopify = new Shopify.Clients.Rest(process.env.SHOPIFY_STORE, process.env.SHOPIFY_ACCESS_KEY);
        this.payplus = new PayPlus(process.env.PAYPLUS_API_KEY, process.env.PAYPLUS_SECRET_KEY);
    }

    // Fromats date in a ccertain way (YYYY-MM-DD)
    getFormattedDate = (date_obj) =>{
        const year = new Intl.DateTimeFormat('en', { year: 'numeric' }).format(date_obj);
        const month = new Intl.DateTimeFormat('en', { month: '2-digit' }).format(date_obj);
        const day = new Intl.DateTimeFormat('en', { day: '2-digit' }).format(date_obj);
        const formatted_date = `${year}-${month}-${day}`;
        return formatted_date;
    }


    // Gets last transaction from shopify order and verifies whether it was paid using PayPlus
    #getShopifyOrderPayplusTransaction = async (order_id) => {
        let data = await this.shopify.get({
            path: `orders/${order_id}/transactions`,
        });
        const transaction = data.body.transactions[data.body.transactions.length - 1];
        const payment_gateway = transaction.gateway;
        if(payment_gateway == "PayPlus - Payment Gateway"){
            return transaction;
        }
        return false;
    }

    // Updates notes of specific Shopify Order
    #updateShopifyOrderNotes = async (order_id, transaction) => {
        try {
            const data = await this.shopify.put({
                path: `orders/${order_id}`,
                data: {"order":{"id":order_id,"note":`Type of card: ${transaction.card}\nNumber of payments: ${transaction.number_of_payments}`}},
                type: DataType.JSON,
            });
            if(data?.body?.order?.id){
                console.log(`Updated notes of ${data.body?.order?.id} to "Type of card: ${transaction.card} Number of payments: ${transaction.number_of_payments}"`);
            } else {
                throw new Error("Couldn't find id of updated object")
            }
        } catch (error) {
            throw new Error(JSON.stringify(error));            
        }
    }

    // Method that inserts PayPlus transaction data into Shopify Order notes. Serves as an entry point for whole functionality
    syncOrderData = async (order_id) => {
        try {
            const transaction = await this.#getShopifyOrderPayplusTransaction(order_id);
            if(transaction){
                const payment_id = transaction.receipt.payment_id;
                const transaction_date = new Date(transaction.processed_at);
                const date = {
                    start: this.getFormattedDate(transaction_date),
                    end: this.getFormattedDate(transaction_date.setDate(transaction_date.getDate() + 1))
                }
                const payPlusData = await this.payplus.getPaymentData(payment_id, date);
                this.#updateShopifyOrderNotes(order_id, payPlusData);
                return {message: "success"};
            } else {
                throw new Error("Not PayPlus transaction");
            }
        } catch (error) {
            throw new Error(JSON.stringify(error));
        }
    }
}