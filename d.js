//binary search

function binarySearch(arr, target) {
    let left = 0;
    let right = arr.length - 1;

    while (left <= right) {
        let mid = Math.floor((left + right) / 2);

        if (arr[mid] === target) {
            return mid;
        }

        if (arr[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }

    return -1;
}

console.log(binarySearch([1,2,3,4,5,6], 4));

//strig  reverse 
function reverseString(string){
    let reve= '';
    for (let i=string.length-1;i>=0;i--){
        reve+=string[i]
    }
    return reve
}

console.log(reverseString("javascript"));


function bubblesort(arr){
    for(let i=0;i<arr.length;i++){
        for (let j=0;j<arr.length-1;j++){
            if(arr[j]>arr[j+1]){
                [arr[j],arr[j+1]]=[arr[j+1],arr[j]]
            }
        }
    }
    return arr;



}

//reverse an array
function reverseArray(arr){
let left=0;
let right=arr.length-1;
while(left<right){
    [arr[left],arr[right]]=[arr[right],arr[left]];
    left++;
    right--;
}
return arr
}
console.log(reverseArray([23,35,57,48,49]))
console.log(bubblesort([2,32,22,224,2242]))


//duplicate in array

function duplicateArr(arr){
const single=new Set;
const duplicate=new Set
for (let num of arr){
    if(single.has(num)){
        duplicate.add(num)
    }
    else
        single.add(num)
}
return [...duplicate];
}
console.log(duplicateArr([4,54,34,224,34,45,46,46]))

