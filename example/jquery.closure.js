jQuery.callback = function(o, m){
  return function(){
    return m.apply(o, arguments);
  };
};
jQuery.closeArgs = function(o, m){
  var args = Array.prototype.slice.call(arguments, 2);
  return function(){
    m.apply(o, args);
  };
};