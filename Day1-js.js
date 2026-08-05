// //Printing a line in js 
// // console.log('Hello Genz')

// // var x= 10
// // x=15   //reassign the value
// // console.log(x)


// // var x=35;
// // console.log(x) //redeclaring  the value


// //let 
// // let y =30;
// // console.log(y);

// //const

// // const x=2026;

// // console.log(x)

// // {
// //     const x=56;
// //     let y=78
// //     console.log(x);
// //     console.log(y)

// // }

// //Three type of scope  : Global,function and block scope 


// // function test(){
// //     var a=10;
// //     console.log(a)
// // }

// // console.log(a)


// // {
// //     let x=20;
// //     const y=40;
// // }

// // console.log(x,y)

// function demo (){
//     if(true)


//         {
//         var a=1;
//         let b=2;
//         const c=3

//     }


//     console.log(a);
//     console.log(b);
//     console.log(C)
// }
// demo()



// //Non primitve
// //array
// const arr = [2, 353, 33664, 4645, 5];
// console.log(typeof (arr))



// //object 
// const obj = {
//     nam: "abhishek",
//     age: 20,
//     occupation: 'student '


// }
// let user = 'Javascript'
// console.log(typeof (user))


// const x = '10'
// const y = 10
// console.log(x === y)

// //if else

// const marks = 86;
// if (marks >= 40) {
//     console.log("Congratulations,You have Passed ");
// }
// else {
//     console.log("Fails");
// }

// //ternary operator 
// let result = (marks >= 40) ? "Pass" : "fail";
// console.log(result)


// //check if odd or even
// const number = 78;
// if (number % 2 == 0) {
//     console.log("even number")
// }
// else {
//     console.log('odd')
// }


// //switch

// const trafficColor = 'red';
// switch (trafficColor) {
//     case 'red': console.log('Stop immediately'); break;
//     case 'yellow': console.log('Prepare to stop'); break;
//     case 'green': console.log('Good to go '); break;
//     default: console.log('invalid light')
// }



// //for loop
// for (let i = 0; i < 5; i++) {
//     console.log(i)
// }

// //while 
// let count = 5;
// while (count < 5) {
//     console.log("Value :", count);
//     count++
// }

// //do while 
// do {
//     console.log("value :", count);

//     count++
// } while (count < 5)

// //function 

// function greetMorning(name) {
//     console.log(' morning ', name)
// }
// function greet(name) {
//     return `Good morning ',${name}`
// }

// const greeting=greet('abhishek')
// console.log(greet('abhishek'))
// console.log(greeting)
// greetMorning('Avinash')

// //regular function
// function add(a,b){
//     return a+b;

// }
// console.log(add(4,5))

// //arrow function 

// const addition=(a,b)=>a+b;
// console.log(addition(5,6))


//hoisting

// console.log(x);
// const x=10

//objects 
const obj = {
    name: "abhishek",
    city: 'kolkata',
    college: "Supreme Foundation"


}

const user = {
    id: 101,
    name: "Alice Smith",

    address: {
        street: "123 Innovation Way",
        city: "San Francisco",
        zipCode: "94105"
    },
    greet: function () {
        console.log('good morning',this.name)    //method 
    }
};

console.log(user.address.zipCode);
user.greet()
console.log(user['id'])
console.log(user.id)





//array  methods

const number=[1,3,4,6,10];  
const doubled =number.map(num=>num*2)  //map method
console.log(doubled)

//filter method 
const evenValue=number.filter(num=>num%2==0)
console.log(evenValue)

//reduce method

const totalValue=number.reduce((accumulator,current)=>{
    return accumulator+ current
},0);
console.log(totalValue);

//find method
const arrNumber= [24,2,32,34,25,43,67]
const found=arrNumber.find(number=>number>100)
console.log(found);
//sort method   

const ascendingSorted = arrNumber.sort((a,b)=>{
    return a-b;
})
console.log(ascendingSorted)
const descendingSorted = arrNumber.sort((a,b)=>{
    return b-a;
})

console.log(descendingSorted)
