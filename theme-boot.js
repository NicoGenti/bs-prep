try{
  var t=JSON.parse(localStorage.getItem('bsprep.v1')||'{}').theme;
  if(!t)t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
  document.documentElement.dataset.theme=t;
}catch(e){}
