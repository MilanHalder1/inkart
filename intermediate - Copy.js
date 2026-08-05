// function delay(second){
//     return new Promise(resolve=>setTimeout(resolve,second))
// }

// async function typeLetter(){
//     console.log('a');
//     await delay(1000);
//     console.log('b');
//     await delay(1000);
//     console.log('c')
// }
// typeLetter()


//currying
function applyDiscount(discount){
    return function(price){
        return price-(price*discount/100);
    }
}

const discount10=applyDiscount(10);
console.log(discount10(1000))
