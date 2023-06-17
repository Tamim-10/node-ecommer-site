const sum = (a,b) => {
    if(a && b){
        return a+b;
    }
    throw new Error('Invalid Arguments'); 
}
try{
    console.log(sum(1));
}catch(error){
    console.log('Error Occured!');
    // console.log(error);
}

console.log('This works!');


//In synchronous code try catch is used for error handling
//In Asynchronous code then catch used for error handling 