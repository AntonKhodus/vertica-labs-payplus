import request from 'request';

// class PayPlus contains method that receives specific data from certain PayPlus transaction
export default class PayPlus{

  constructor(api_key, secret_key){
    this.api_key = api_key;
    this.secret_key = secret_key;
  }

  // Gets transaction by searching for certain "payment_id" (shopify order tansaction receipt) in PayPlus transactions list
  getPaymentData = async (payment_id, date_obj) => {
    return new Promise((res,rej) => { 
      request({
        method: 'POST',
        url: 'https://restapi.payplus.co.il/api/v1.0/Transactions/View',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': JSON.stringify({'api_key':this.api_key,'secret_key':this.secret_key})
        },
        body: JSON.stringify({
          "fromDate" : date_obj.start,
          "untilDate" : date_obj.end
        })
      }, function (error, response, body) {
        if(response.statusCode == 200){
          JSON.parse(body).data.forEach(el => {
            if(el.transaction.more_info == payment_id){
              res({card: el.data.card_information.brand_name, number_of_payments: el.transaction.payments.number_of_payments});
            }
          })
        } else {
          const error_obj = JSON.parse(body);
          error_obj.origin = "PayPlus API";
          rej(error_obj);
        }
      });
    });
  }
}