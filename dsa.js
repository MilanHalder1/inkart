// //reverse string
    // function reverseString(str){
    //      let reve= '';
    //     for (let i=str.length-1;i>=0;i--){
    //         reve+=str[i]
    //     }
    //     return reve
    // }

    // console.log(reverseString("Abhishek"))

// function reverseArray(arr){
//     let left=0;
//     let right=arr.length-1;
//     while(left<right){
//         [arr[left],arr[right]]=[arr[right],arr[left]];
//         left++;
//         right--;
//     }
//     return arr
// }
// console.log(reverseArray([22,33,24,,222,242]))

// function duplicateArry(arr){
//     let single= new Set;
//     let duplicate= new Set;
//     for(let num of arr){
//         if(single.has(num)){
//             duplicate.add(num)
//         }
//         else{
//             single.add(num)
//         }
//     }
//     return [...duplicate]

// }


// console.log(duplicateArry([34,24,32,24,252]))




//remove duplicates
function removeDuplicates(arr) {
    return [...new Set(arr)]
}

console.log((removeDuplicates([333, 54, 33, 333, 43, 33, 22, 44, 33])))

//find max number in array
function arrayMax(arr) {
    let max = arr[0]
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] > max) {
            max = arr[i]
        }
    }
    return max
}

console.log(arrayMax([366, 24, 22, 353, 245, 242]));

//check palindrome

function palindrome(str) {
    return str === str.split('').reverse().join('')
}
console.log(palindrome('madam3'))

function countCharacter(str) {
    const count = {};
    for (const char of str) {
        count[char] = (count[char] || 0) + 1;
    }
    return count;   
}

console.log(countCharacter('sweata'));

function twoSum(arr, target) {
    const map = new Map();

    for (let i = 0; i < arr.length; i++)
         {
        const diff = target - arr[i];
        if (map.has(diff)) {
            return [map.get(diff), i]
        }
        map.set(arr[i], i)
       }

      return [];
}
console.log(twoSum([2, 7, 11, 16, 3, 6], 9))


