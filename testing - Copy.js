//binary search
function binarySearch(arr,target){
let left=0;
let right=arr.length-1;
while(left<=right){
    let mid=Math.floor((left+right)/2);
    if(arr[mid]===target){
        return mid;
    }
    if(arr[mid]<target){
        left=mid+1;
    }
    else{
        right=mid-1
    }
}
return -1
}
console.log(binarySearch([10,34,56,69,89,95],69));

//bubble sort
function bubblesort(arr){
for(let i=0;i<arr.length-1;i++){
    for (j=0;j<arr.length-1;j++){
        if(arr[j]>arr[j+1]){
            [arr[j],arr[j+1]]=[arr[j+1],arr[j]]
        }
    }
}
return arr
}
console.log(bubblesort([6,69,89,10,34,5,95]))

//reverse striing
function reverseString(string){
    let reverse='';
    for (let i=string.length-1;i>0;i--){
        reverse+=string[i]
    }
    return reverse

}

console.log(reverseString('Interview'))
//reverse arry
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
console.log(reverseArray([25,353,224,24,56]))

//duplicates in array
function duplicate(arr){
const exist=new Set();
const duplicate=new Set();
for (let num of arr){
    if(exist.has(num)){
        duplicate.add(num)
    }else exist.add(num)
}
return [...duplicate]
}
console.log(duplicate([34,3,42,34,35,35]))