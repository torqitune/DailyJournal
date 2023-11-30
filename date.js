//jshint esversion:6
exports.getDate = function(){     //exporting our function
    const options ={
        weekday:'long',
        month:'long',
        day:'numeric'
      };
    
      const today = new Date();
      return today.toLocaleDateString("en-Us",options);
      
}

exports.getDay = function(){
    const options ={
        weekday:'long'
      };
    
      const today = new Date();
      return today.toLocaleDateString("en-Us",options);
      
}

 