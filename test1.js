//binarysearch
function binarySearch(arr,target){
  let left=0;
  let right=arr.length-1;
  while(left<=right){
    let mid=Math.floor((left+right)/2);
    if(arr[mid]==target){
      return mid
    }
    if(arr[mid]<target){
      left=mid+1
    }
    else right=mid-1
  }

  return -1
}






console.log(binarySearch([24,45,65,89,90,891],891))

//bubble sort

function bubblesort(arr){
for(let i=0;i<arr.length;i++){
 for(let j=0;i<arr.length-1;j++){
  if(arr[j]>arr[j+1]){
    [arr[j],arr[j+1]]=[arr[j+1],arr[j]];
  }
 }

}
return arr;
}


console.log(bubblesort([24,45,65,22,323,89,90,891]));