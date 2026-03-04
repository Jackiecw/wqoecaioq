const axios = require('axios');
const FormData = require('form-data');
const form = new FormData();
form.append('name', 'Test Post');
form.append('sku', 'TEST-004');
form.append('category', 'PROJECTOR');
form.append('outerBoxLength', '100');
form.append('outerBoxWidth', '200');
form.append('outerBoxHeight', '300');
form.append('pcsPerBox', '123');
form.append('outerBoxWeight', '123');

axios.post('http://127.0.0.1:3100/api/admin/products', form, { headers: form.getHeaders() })
    .then(res => console.log("Success:", res.data))
    .catch(err => {
        if (err.response) {
            console.error("Response Error:", err.response.data);
        } else {
            console.error("Network Error:", err.message);
        }
    });
