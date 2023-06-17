//Client Side Javascript code
const deleteProduct = (btn) => {
    const prodId = btn.parentNode.querySelector('[name=productId]').value;
    const csrf   = btn.parentNode.querySelector('[name=_csrf]').value;
    const productElement = btn.closest('article');

    console.log(`prodId: ${prodId}`);
    console.log(`csrf: ${csrf}`);

    fetch('/admin/product/' + prodId,{  
        method  :'DELETE',
        headers :{
            'csrf-token' : csrf  
        }
    })   
    .then(result => {
        return result.json();//Result message comes from server end
    })  
    .then(data => {
        console.log(data);
        productElement.remove();//Mot supported in Internet Explorer 11 (or earlier).
        // productElement.parentNode.removeChild(productElement);// Work on all browsers 
    })   
    .catch(err => {
        console.log(err); 
    })
};  