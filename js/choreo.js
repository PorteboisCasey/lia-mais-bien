/* Stub du socle. L'agent 3 le remplace par la chorégraphie (ScrollTrigger). */
(function () {
  var el = document.getElementById('casey');
  if (!el || !window.Casey) return;
  Casey.mount(el);
  Casey.pose('idle');
})();
