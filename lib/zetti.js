//javascript for zetti
//global variables
var hroot = window.location.href.replace(/\?\d+([?#])/g, '$1'); //removes random numbers used to force reload
var hfile, hloc, iframe; //set by load()
var header, nav, main, cont, rhs, disp, mainMenu;  //set by load()
var navopen, yaml, ifid; //set by load()
var pageid; //set by loadfile()
var usedark; //set by root script
var files; //from sitemapRaw.txt by root script
var fileList = ''; //'<details><summary>/</summary>';
var cookietime = 0; //hack to solve main 'double scrolling' issue...
var preventDefault = true; // if true, turn off default context menu
var loadOriginal = false; //if true, load original file
var showLinks = false; //if true, show links in RHS column
var popups;
var local = false; //if true, local edits exist
var ed; //editor iframe
var useScrollTop = true; //if true, use scrollTop from cookie
var touchstartX = 0, touchstartY = 0, touchendX = 0, touchendY = 0, touchstartTime = 0; //for swipe
var onlongtouch, timer, touchduration = 800, ehref = '', menu=false;//for popups
// var start=performance.now();
//end global variables

function getCookie(x) { //returns cookie x as string
  for (let c of document.cookie.split(';')) {
    c = c.trim().split('=');
    if (c[0] == x) { return c[1]; }
  }
  return "";
}
function loaddarkcss() { //can't call this from iframe
  const style = document.createElement("link"); // Create link element
  style.rel = "stylesheet"; // Set relationship to be a stylesheet
  style.href = "lib/dark.css"; // Set the path to the CSS file
  document.head.appendChild(style); // Add link tag to the head element
}

(function () { //get startup data including sitemapRaw.txt for file list
    usedark = getCookie("dark") == 'true';
    if (usedark) loaddarkcss(); // do up front to avoid white flash on load
    hfile = hroot.split('?file=')[1] || hroot.split('?')[1] || 'index.md';
    hloc = hfile.split('#')[1];
    if(!hloc) hloc = '';
    hfile = hfile.split('#')[0];
    hroot = hroot.split('?')[0];
    if (hroot.includes('index.html')) hroot = hroot.substring(0, hroot.indexOf('index.html'));
    if (hroot.includes('index.md')) hroot = hroot.substring(0, hroot.indexOf('index.md'));
    let xmlhttp1 = new XMLHttpRequest();
    xmlhttp1.onload = function (e) {
      files = xmlhttp1.responseText.split("\n");
      let folder = '';
      let inc = 0; let ipad = 12;
      files.forEach((f, ii) => {
        if (f == '') return;
        let g = '';
        let fname1 = f.substring(f.lastIndexOf('/') + 1);
        let folder1 = f.substring(0, f.lastIndexOf('/'));
        while (!folder1.startsWith(folder)) {
          folder = folder.substring(0, folder.lastIndexOf('/'));
          fileList += '</details></div>';
          inc -= 1;
          if (inc < 0) inc = 0;
        }
        if (!folder1.startsWith(folder)) folder = '';
        while (folder != folder1) {
          let folder2 = folder1;
          if (folder != '') folder2 = folder1.substring(folder.length + 1);
          if (folder2.indexOf('/') < 0) folder = folder1;
          else {
            if (folder != '') folder += '/';
            folder += folder2.substring(0, folder2.indexOf('/'));
          }
          fileList += '<div style="margin-left:' + (inc * ipad) + 'px"><details><summary>' + folder.substring(folder.lastIndexOf('/') + 1) + '</summary>';
          inc += 1;
        }
        if (f != '') g = hroot + '?file=' + f;
        fileList += '<li  style="list-style-type: none;padding-left:' + (inc <= 0 ? 0 : ipad) + ';">' +
          '<a href="' + g + '" onMouseOver="peek(event.ctrlKey,`' + g + '`)">' + fname1 + '</a></li>';
        });
    };
    xmlhttp1.open("GET", './sitemapRaw.txt', true)
    xmlhttp1.send();
})();

function home() { window.location = hroot; }

function setTitle(s) { // set page title
  if (window.innerWidth > 1000 && s == '') s = '<< &nbsp; >>'
  else if (s.indexOf('?') > 0) s = s.substring(0, s.indexOf('?'));
  document.getElementById('titleMain').innerHTML = s;
}

function peek(event, src) { //show peek window
  let p = document.getElementById('peekPopup');
  if (!event && src == '') {
    document.getElementById('peekPopupTitle').innerText ='Peek';
    fadeOut(p.parentElement);
    ifid = ''
  } else if (event) {
    document.getElementById('peekPopupTitle').innerText = src.split('?file=')[1] || src.split('?')[1] || '';
    p.innerHTML = '<iframe id="peek1" src="' + src + '" ></iframe>';
    fadeIn(p.parentElement);
    ifid = 'peek1';
  }
}

function toggleHTML() { //show html
  let html = main.innerHTML;
  if (html.substr(0, 5) == '<xmp>') {
    main.innerHTML = html.substr(5, html.length - 11)
  } else {
    main.innerHTML = '<xmp>' + html.replace(/xmp\>/g, 'xmp&gt;') + '</xmp>'
  }
}

function darkmode(makedark) {
  if (makedark) {
    usedark = true; loaddarkcss();
    document.cookie = 'dark=true; expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/';
  } else {
    usedark = false;
    document.cookie = 'dark=false; expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/';
  }
}

function loadJS(url, async = false) { //process scriptz elements
  let elem = document.createElement("script");
  elem.setAttribute("src", url);
  elem.setAttribute("type", "text/javascript");
  elem.setAttribute("async", async);
  document.body.appendChild(elem);
}

function loadup(t, elmnt, forMDE) {
  let html = '';
  document.getElementById('medit').style.display = "none";
  document.getElementById('bedit').setAttribute("hidden", "hidden");
  parent.document.getElementById('peekEdBtn').setAttribute("hidden","hidden");
  if (hfile.endsWith('.md')) {
    document.getElementById('medit').style.display = "block"; //show menu item for markdown file edit
    if (local || forMDE) {
      document.getElementById('bedit').removeAttribute("hidden"); //show button if local edit already exists
      parent.document.getElementById('peekEdBtn').removeAttribute("hidden"); //& if peek window
    }
    let re = /\[\[(.*?)]]/g, m;//in markdown files, replace wikilink with full path to file
    while (m = re.exec(t)) {
      let s = m[1], s1 = '', s2 = '';
      if (s.indexOf('|') > 0) { //if | is present, text after | as link
        s2 = s.substring(s.indexOf('|') + 1);
        s = s.substring(0, s.indexOf('|'));
      }
      if (s.indexOf('.') < 0) s += '.md';
      s = s.toLowerCase();
      for (i = 0; i < files.length; i++) { //include all matching links
        if (files[i].toLowerCase() == s || files[i].toLowerCase().endsWith('/' + s)) {
          if (s1 != '') s1 += ' & '; //& indicates alternative link
          if (s2 == '') s2 = files[i].substring(files[i].lastIndexOf('/') + 1);
          if (s2.includes('.')) s2 = s2.substring(0, s2.indexOf('.'))
          s1 += '[[' + files[i] + '|' + s2 + ']]';
        }
      }
      if (s1 != '') {
        t = t.substring(0, re.lastIndex - m[0].length) + s1 + t.substring(re.lastIndex);
        re.lastIndex += s1.length - m[0].length;
      } else { //missing link
        t = t.substring(0, re.lastIndex - m[0].length) + m[0].replace(/\[\[(.*)]]/, '[ [$1] ]') + t.substring(re.lastIndex);
      }
    }
    if (t.match(/\[\[.*?\]\]/)) { //wikilinks
      t = t.replace(/\[\[([^.\]]*?)\|([^\]]*?)\]\]/g, '[[$1.md|$2]]'); //add .md to [[wikilinks|text]] with no extension
      t = t.replace(/\[\[([^.]*?)\]\]/g, '[[$1.md]]'); //add .md to [[wikilinks]] with no extension
      while (t.match(/\[\[([^\]|]*?)\s(?!=)/)) t = t.replace(/\[\[([^\]|]*?)\s(?!=)/, '[[$1%20'); //remove spaces in wikilinks
      //note - the negative look ahead (?!=) is to allow image resizing, eg. ![](link =100x100)
      t = t.replace(/\[\[([^\]]*?)\|(.*?)\]\]/g, '[$2]($1)'); //wikilinks with text
      t = t.replace(/\[\[(.*?)\.md\s*\]\]/g, '[$1]($1.md)'); //[[link.md]] to [link](link.md)
      t = t.replace(/\[\[(.*?)\]\]/g, '[$1]($1)'); //[[link]] to [link](link)
    }
    t = t.replace(/([^!]?)\[(.*?)\]\((?!http)\??([^#].*?)\)/g, '$1[$2](<?$3>)'); //(?<!!)markdown style links open internally, but not ![](link)
    while (t.match(/\[[^\]]*?%20[^\]]*?\]\(/)) t = t.replace(/\[([^\]]*?)%20([^\]]*?)\]\(/, '[$1 $2]('); //remove %20 in markdown link text
    function math(match, formula) { return katex.renderToString(formula,{throwOnError:false}) }
    t = t.replace(/\$\$(.*?)\$\$/mg, math) //katex render math formulas bracketed as $$formula$$
    t = t.replace(/\$(.*?)\$/mg, math) //katex render math formulas bracketed as $formula$
    // allow js or html codeblock editing and execution
    let s = "this.parentElement.nextElementSibling.innerText";
    let s0 = "this.parentElement.nextElementSibling.innerHTML";
    let s1 = ".replace(/\\n=\.\*/s,'')";
    let s2 = `'<span style="color:blue;">'`;
    t = t.replace(/```(js|html).*?\n(.*?)(\n```)/sg,
      `<button onclick="${s0}=${s0}${s1}+'\\n=>><em>'+eval(${s}${s1})+'</em>';"> &nbsp;$1&nbsp;</button>
      <pre  style="margin-top:0;padding-top:0;"><code contenteditable="true" onclick="rmhi(this);">$2</code></pre>`);
    var shd = new showdown.Converter({ metadata: true, parseImgDimensions: true, simplifiedAutoLink: true, ghCodeBlocks: true });
    yaml = t.replace(/^\s*?---\s(.*?)\s*?---.*/s, '$1').split('\n').map(x => x.split(':').map(y => y.trim())).reduce((a, b) => { a[b[0]] = b[1]; return a; }, {});
    if ('original,github'.includes(yaml.mdflavor)) shd.setFlavor(yaml.mdflavor);
    else shd.setFlavor('github');
    html = shd.makeHtml(t) + '<br>';
    let o = loadOriginal ? '!' : '';
    if (!loadOriginal || forMDE) {
      html = `<iframe id='ed' style='display:none' src='./tinymde.html?${hfile}${o}' width="100%" allowfullscreen scrolling="no"></iframe><!-- start -->` + html;
    }
    loadOriginal = getCookie('loadOriginal') == 'true'; //reset if changed by tinymde
  } else if (hfile.endsWith('.md.html')) {
    html = t;
  } else if (hfile.endsWith('.txt') || hfile.endsWith('.json') || hfile.endsWith('.yaml') ||
    hfile.endsWith('.js') || hfile.endsWith('.css') || hfile.endsWith('.xml')) {
    html = t.replace(/\n/g, '<br>');
  } else if (hfile.endsWith('.pdf')) {
    if (hfile.startsWith('http')) {
      html = '<iframe src="' + hfile + '" width="100%" height="100%" type="application/pdf"></iframe>';
    } else {
      let ss = 'lib/pdfjs/web/viewer.html?file=../../../' + hfile;
      html = `<iframe onload="main.style.overflow='hidden';" id="iid" src="${ss}" style="width:100%;height:100%;border:0 none;margin-bottom:0;margin-left:0;"></iframe><br><div hidden>`;
      iframe = true;
    }
  } else {
    // if (usedark) html += '<div style="background-color: darkgray;">';
    html += `<a href='${hfile}'>full page here</a><iframe src='${hfile}' width=100% height=100% />`;
    // if (usedark) html += '</div>';
    iframe = true;
    document.getElementById('orig').innerHTML = t;
  }
  if (elmnt == main || elmnt == parent.main) {
    elmnt.innerHTML = html;
    let na = elmnt.querySelectorAll('a');
    for (let i = 0; i < na.length; i++) {
      na[i].addEventListener("mouseover", (e) => { peek(e.ctrlKey, na[i].href); });
    }
    if (useScrollTop) elmnt.scrollTop = Number(getCookie("mainscr" + pageid));
    else useScrollTop=true; //can be set to false by interceptClickEvent
    getNav(hfile);
    setTitle(yaml.title || hfile.substring(hfile.lastIndexOf('/') + 1).replace(/%\d\d/g, ' '))//.replace('.md',''));
    // let scripts = elmnt.getElementsByTagName('scriptz'); //uncomment this section to allow running scripts in the loaded page
    // for (let i = 0; i < scripts.length; i++) {                           //but be careful, it can be a security risk
    //   scripts[i].style.display = 'none';
    //   if (scripts[i].src) loadJS(scripts[i].src);
    //   else { eval(scripts[i].textContent); }
    // }
    hljs.highlightAll();
    //if ,forMDE) {ed=document.getElementById('ed');ed.style.display='block';resizeiframe(ed);}
  } else {
    let elmntDoc = elmnt.contentDocument || elmnt.contentWindow.document;
    elmntDoc.innerHTML = html;
    // elmnt.parentElement.innerHTML = html;
    // document.getElementById('peek').innerHTML=html; 
    // fadein(elmnt.parentElement.parentElement);
  }
}

function loadfile(fname, elmnt, forMDE) {
  pageid = btoa(fname.substr(-13, 10)).replaceAll('=', '0'); //max 10 chars, mostly excluding .md
  local = false;
  if (fname.startsWith('http') || fname.endsWith('.pdf')) {
    loadup('', elmnt, false);
  } else {
    let t = '';
    async function checkForLocal(name) {
      document.getElementById('peekEdBtn').setAttribute("hidden", "hidden");
      let obj = await pouchLoad(name);
      if (obj && obj.contents && obj.contents != '') {
        t = obj.contents;
        local = true;
      }
    }
    let xmlhttp = new XMLHttpRequest();
    xmlhttp.onload = async function (e) {
      darkmode(getCookie("dark") == "true");
      t = this.responseText;
      if (!loadOriginal) await checkForLocal(fname);
      loadup(t, elmnt, forMDE);
    }
    xmlhttp.open("GET", fname, true);
    xmlhttp.send();
  }
}

load = function () {
  //initialise global variables
  cookietime = 0; //hack to solve main 'double scrolling' issue...
  header = document.getElementById("header");
  nav = document.getElementById("nav");
  main = document.getElementById("main");
  cont = document.getElementById("cont");
  rhs = document.getElementById("rhs");
  disp = document.getElementById("disp");
  mainMenu=document.getElementById("menuMain");
  navopen = ''; yaml = {}; ifid = ''; currentSrc = ''; iframe = false;
  //end global variables
  nav.onscroll = function () { setCookie('navscr', nav.scrollTop); };
  main.onscroll = function () { if (cookietime == 0) { setCookie('mainscr' + pageid, main.scrollTop); cookietime = 1; } else { cookietime = 0; } };
  cont.onscroll = function () { setCookie('contscr' + pageid, cont.scrollTop); };
  if (window.innerWidth <= 1000) {
    nav.style.display = 'none'; rhs.style.display = 'none'; main.style.display = 'block';
    main.style.left = '0'; main.style.width = '100%';
  }
  else { nav.style.display = 'block'; rhs.style.display = 'block'; main.style.left = '20em'; main.style.width = 'calc(100% - 40em)'; }
  preventDefault = getCookie('noContextMenu') == 'true';
  loadOriginal = getCookie('loadOriginal') == 'true';
  //set up popup windows
  nav.addEventListener("contextmenu", (e) => { if (preventDefault) { e.preventDefault(); return false; } });
  popups = document.getElementsByClassName("popup");
  for (let i = 1; i <= popups.length; i++) {
    dragElement(document.getElementById("popup" + i));
  }
  loadfile(hfile, main, false);
} //end load

getNav = async function (fname) {
  if (nav.innerHTML == '') { //lhs=file list
    nav.innerHTML = '<div class="toc"><h3 style="margin-top:5%;">Site map</h3>' + fileList + '</div>';
    navopen = getCookie("navopen"); //restore nav open states
    let nd = nav.querySelectorAll('details');
    for (let i = 0; i < nd.length; i++) {
      nd[i].addEventListener("toggle", saveNavState, false);
      nd[i].open = (nd.length == navopen.length) && (navopen[i] == '1');
    }
    let na = nav.querySelectorAll('a');
    for (let i = 0; i < na.length; i++) {
      na[i].addEventListener("touchstart", touchstart, false);
      na[i].addEventListener("touchend", touchend, false);
    }
    nav.scrollTop = Number(getCookie("navscr"));
  }
  if (fname.endsWith('.pdf')) { //for pdf remove contents bar (built in) and exit
    if (rhs.style.display != 'none') toggleSide(rhs);
    return;
  }
  html = ''; //rhs=contents panel
  ifid = 'peek2';
  document.getElementById('peek2').src = 'network.html?file=' + fname;
  let toc = main.querySelectorAll('h1,h2,h3,h4,a'); //can put img here
  let iid;
  if (iframe) {
    toc = document.getElementById('orig').querySelectorAll('h1,h2,h3,h4,a');
    document.getElementById('orig').innerHTML = '';
    iid = document.getElementById('iid'); //iframe id
  }
  let indent = '';
  for (let ti of toc) {
    if (ti.nodeName == 'A') {
      if (!ti.href == '' && !ti.href.startsWith('#')) {
        if (showLinks) {
          let s = ti.href;
          s = s.replace(/\?\d+([?#])/g, '$1'); //remove ?ddd used to force reload
          html += indent + `<a href="${ti.href}" onMouseOver="peek(event.ctrlKey, '${ti.href}')">${ti.textContent}</a><br>`;
          ti.onMouseOver = `peek(event.ctrlKey, '${ti.href}')`
        }
      }
    } else if (ti.id) {
      html += `<li class="${ti.nodeName}" onclick="if(main.style.display=='none'){toggleSide(rhs);} document.getElementById('${ti.id}').scrollIntoView();setCookie('mainscr' + pageid, main.scrollTop);">`;
      //the clicks will be intercepted by 'interceptClickEvent' to deal with iframes
      html += ti.innerHTML+'</li>';
      switch (ti.nodeName) {
        case 'H1': indent = ' - '; break;
        case 'H2': indent = ' &nbsp;- '; break;
        case 'H3': indent = ' &nbsp;&nbsp;&nbsp; - '; break;
        case 'H4': indent = ' &nbsp;&nbsp;&nbsp;&nbsp - '; break;
        default: indent = '';
      }
    }
  }
  if (html.length < 10 && window.innerWidth > 1000) toggleSide(rhs);
  cont.innerHTML = '<div class="toc"><h3 style="margin-top:5%">Contents <button onclick="togglePlot();" title="toggle graph"  style="border:none;cursor:pointer;">❄</button> <button title="toggle links" onclick="showLinks=!showLinks;getNav(hfile);"  style="border:none;cursor:pointer;">@</button></h3>' + html + '</div>';
  cont.scrollTop = Number(getCookie("contscr" + pageid));
} //end getnav

function togglePlot() { //toggle plot in contents panel
  if (disp.style.display == "block") {
    disp.style.display = "none";
    cont.style.top = "0";
    cont.style.height = "100%";
  }
  else {
    disp.style.display = "block";
    if (window.innerWidth > 1000) {
      cont.style.top = "30%";
      cont.style.height = "70%";
    } else {
      cont.style.top = "40%";
      cont.style.height = "60%";
    }
  }
}

function mainOn() { //toggle main panel only display
  if (window.innerWidth < 1000) {
    nav.style.display = 'none'; rhs.style.display = 'none'; main.style.display = 'block';
    main.style.left = '0'; main.style.width = '100%';
  }
  else {
    nav.style.display = 'block'; rhs.style.display = 'block'; rhs.style.display = 'block';
    main.style.left = '20em'; main.style.width = 'calc(100% - 40em)';
  }
}

function toggleSide(side) { //toggle LH/RH side panel display
  if (window.innerWidth < 1000) {
    if (side == nav) {
      nav.style.display = (nav.style.display == 'none' ? 'block' : 'none');
      rhs.style.display = 'none';
      main.style.left = (nav.style.display == 'none' ? '0' : '20em');
      main.scrollLeft = 0;
    } else {
      rhs.style.display = (rhs.style.display == 'none' ? 'block' : 'none');
      // disp.style.width = (rhs.style.display == 'none' ? '90%' : '100%') //to trigger graph redraw
      nav.style.display = 'none';
      main.style.left = 0;
      main.scrollLeft = 0;
    }
  } else {
    main.style.display = 'block;'
    if (side == nav) { nav.style.display = (nav.style.display == 'none' ? 'block' : 'none'); }
    else { rhs.style.display = (rhs.style.display == 'none' ? 'block' : 'none'); }
    main.style.left = (nav.style.display == 'none' ? '0' : '20em');
    main.style.width = (nav.style.display == 'none' ? (rhs.style.display == 'none' ? '100%' : 'calc(100% - 20em)')
      : (rhs.style.display == 'none' ? 'calc(100% - 20em)' : 'calc(100% - 40em)'));
  }
}

window.onresize = function (event) { //toggle side panels on resize
  if (!main) return;
  main.style.display = 'block';
  if (window.innerWidth < 1000) {
    nav.style.display = 'none';
    rhs.style.display = 'none';
    main.style.left = '0';
    main.style.width = '100%';
  } else {
    nav.style.display = 'block';
    rhs.style.display = 'block';
    nav.style.width = '20em';
    main.style.left = '20em';
    main.style.width = 'calc(100% - 40em)';
  }
}

// var browser = (function() {
//   var test = function(regexp) {return regexp.test(window.navigator.userAgent)}
//   switch (true) {
//       case test(/edg/i): return "Microsoft Edge";
//       case test(/trident/i): return "Microsoft Internet Explorer";
//       case test(/firefox|fxios/i): return "Mozilla Firefox";
//       case test(/opr\//i): return "Opera";
//       case test(/ucbrowser/i): return "UC Browser";
//       case test(/samsungbrowser/i): return "Samsung Browser";
//       case test(/chrome|chromium|crios/i): return "Google Chrome";
//       case test(/safari/i): return "Apple Safari";
//       default: return "Other";
//   }
// })();

//if (browser()=="Apple Safari") { 
    // onorientationchange = function (event) { //toggle side panels on orientation change
    //     mainOn();
    //     alert(''+window.innerWidth)
    // }
// } else {
//     ScreenOrientation.onchange = function (event) { //toggle side panels on orientation change
//         mainOn();
//         alert(''+window.innerWidth)
//     }
// }
// document.addEventListener("orientationchange", function(event) {
//   alert('> '+event.target.screen.orientation.angle);
// });

function handleGesture() { //swipe to toggle side panels
  if (nav.style.display == 'block') { //close lh sidebar
    if (touchendX < touchstartX - 50 || touchendX > touchstartX + 50) { toggleSide(nav); }
  } else if (rhs.style.display == 'block') { //close rh sidebar
    if (touchendX < touchstartX - 50 || touchendX > touchstartX + 50) { toggleSide(rhs); }
  } else { //open sidebar
    if (touchendX < touchstartX - 50) { toggleSide(rhs); } //swipe left
    if (touchendX > touchstartX + 50) { toggleSide(nav); } //swipe right
  }
}

function gethtml() { //this is for downloading final html file
  let name = location.href.split('?file=')[1] || 'index.md';
  let a = document.createElement('a');
  a.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(document.getElementById("main").innerHTML));
  a.setAttribute('download', name + '.html');
  if (document.createEvent) {
    var event = document.createEvent('MouseEvents');
    event.initEvent('click', true, true);
    a.dispatchEvent(event);
  }
  else {
    a.click();
  }
}

function interceptClickEvent(e) { //for fast load & iframe
  if (e.target instanceof HTMLButtonElement) return;
  if (e.target.href && e.target.href=="javascript:void()") return;
  if (iframe) {
    var id;
    var target = e.target || e.srcElement;
    if (target.tagName == 'A') {
      let f = target.href.split('?file=')[1] || target.href.split('?')[1];
      if (f) {
        let f1 = f.split('#')[1];
        if (f1) {
          f = f.split('#')[0];
          window.location.href = hroot + '?file=' + f + '?' + Math.floor(Math.random() * 999) + '#' + f1;
        } else {
          window.location.href = hroot + '?file=' + f
        }
      }
    } else if (target.tagName == 'LI') {
      id = target.onclick.toString().replace(/.*?getElementById\('(.*)'\).*/s, '$1');
      // e.preventDefault();
      window.location.href = hroot + '?file=' + hfile + '?' + Math.floor(Math.random() * 999) + '#' + id;
    }
  } else if (e.target.href && e.target.href.includes('#')) {
    window.history.pushState(windows.location.href);
    useScrollTop=false; //allows back button to return to source of #header link
  } else if (e.target.href && e.target.href.includes('?')) {
    hfile = (e.target.href.split('?file=')[1] || e.target.href.split('?')[1]).replaceAll('%20', ' ');
    mainOn();
    loadfile(hfile, main, false);
  }
}

(function () { //implement fast load on click & iframe
    if (document.addEventListener) { 
      document.addEventListener('click', interceptClickEvent);
    } else if (document.attachEvent) {
      document.attachEvent('onclick', interceptClickEvent);
    }
})();

function saveNavState() { //save nav state for correct restore
  let details = nav.querySelectorAll('details');
  navopen = '';
  for (let i = 0; i < details.length; i++) {
    navopen += details[i].open ? '1' : '0';
  }
  setCookie('navopen', navopen);
}

function setCookie(x, y) { //sets cookie x (can include pageid) to y
  document.cookie = '' + x + "=" + y + ";max-age=7200;path=/";
}
function getAllCookies() { //returns string of all cookies
  return document.cookie;
}
function removeCookie(x) { //removes cookie x
  document.cookie = x + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}
function removeCookies() { //removes all cookies
  for (const s of document.cookie.split(';')) {
    document.cookie = s.split('=')[0] + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  }
}

async function searchFiles(txt, ans) {
  let s = await fetch('./sitesearch.txt').then(r => r.text()).then(r1 => r1.split('\n'));
  let a = '';
  let regex = new RegExp(txt, 'ig'); //ignore case
  for (let line of s) if (line.search(regex) > 0) {//if(line.replace(regex,'').length!=line.length){
    let j=parseInt(line.substring(0, line.indexOf(' ')));
    let h = '<a href="?file=' + files[j] + '">' + files[j] + '</a>,' + line.substring(line.indexOf(' '), line.indexOf(':'));
    while (line.search(regex) > 0) {
      let i = line.search(regex);
      a += h + '<br>'
      a += line.substr(Math.max(0, i - 30)).substr(0, 90) + '<br>';
      line = line.substr(Math.min(i + 30, line.length));
    }
  }
  if (!ans) alert(a); //if no div element specified, show the answer as an alert
  else {
    if (a == '') a = 'No results found.';
    else a = a.replace(regex, '<b>$&</b>'); //embolden the search term
    document.getElementById(ans).innerHTML = a;
  }
}
window.onkeydown = function (e) { //esc to close peek
  if (e.keyCode == 27) {
    peek(false, '');
  }
}
window.onpopstate = function (e) {
  //can't quickly load here because back button is external
  window.location = location.href;
}

window.addEventListener('touchstart', function (event) {
  if (event.timeStamp < touchstartTime + 500) { touchstartTime = event.timeStamp; return; }
  touchstartX = event.changedTouches[0].screenX;
  touchstartY = event.changedTouches[0].screenY;
  touchstartTime = event.timeStamp;
}, false);

window.addEventListener('touchend', function (event) {
  touchendX = event.changedTouches[0].screenX;
  touchendY = event.changedTouches[0].screenY;
  let t = event.timeStamp - touchstartTime;
  touchstartTime = event.timeStamp;
  if ((t > 100) && (t < 500) && (Math.abs(touchendX - touchstartX) > Math.abs(touchendY - touchstartY))) { handleGesture(); }
}, false);

// for popup windows: based on Window Engine - MIT License - Copyright (c) 2019 Gauthier Staehler
function dragElement(elmnt) {
  var pos1 = 0,
    pos2 = 0,
    pos3 = 0,
    pos4 = 0;
  if ("ontouchstart" in document.documentElement) {
    var pos1touch = 0,
      pos2touch = 0,
      pos3touch = 0,
      pos4touch = 0;
  }
  if (elmnt.firstElementChild) {
    elmnt.firstElementChild.onmousedown = dragMouseDown;
    elmnt.firstElementChild.ontouchstart = dragMouseDown;
  }
  function dragMouseDown(e) {
    if (!"ontouchstart" in document.documentElement) {
      e.preventDefault();
    }
    pos3 = e.clientX;
    pos4 = e.clientY;
    if ("ontouchstart" in document.documentElement) {
      try {
        pos3touch = e.touches[0].clientX;
        pos4touch = e.touches[0].clientY;
      } catch (error) { }
    }
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
    document.ontouchend = closeDragElement;
    document.ontouchmove = elementDrag;
    activePopup(document.getElementById(elmnt.id));
  }

  function elementDrag(e) {
    e.preventDefault();
    if ("ontouchstart" in document.documentElement) {
      pos1touch = pos3touch - e.touches[0].clientX;
      pos2touch = pos4touch - e.touches[0].clientY;
      pos3touch = e.touches[0].clientX;
      pos4touch = e.touches[0].clientY;
      elmnt.style.top = (elmnt.offsetTop - pos2touch) + "px";
      elmnt.style.left = (elmnt.offsetLeft - pos1touch) + "px";
    } else {
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
      elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
      if (elmnt.offsetTop < 0) { elmnt.style.top = "0px"; closeDragElement() }
      if (elmnt.offsetTop > window.innerHeight - 30) { elmnt.style.top = "" + (window.innerHeight - 30) + "px"; closeDragElement() }
    }
  }

  function closeDragElement() {
    document.onmouseup = null;
    document.onmousemove = null;
    document.ontouchend = null;
    document.ontouchmove = null;
  }
}
function fadeIn(elmnt) {
  elmnt.style.opacity = 0;
  elmnt.style.display = "initial";
  activePopup(elmnt);
  if (elmnt.classList.contains("fade")) {
    var opacity = 0;
    var timer = setInterval(function () {
      opacity += 30 / 70;
      if (opacity >= 1) {
        clearInterval(timer);
        opacity = 1;
      }
      elmnt.style.opacity = opacity;
      // activePopup(elmnt);
    }, 250);
  } else {
    elmnt.style.opacity = "1";
    // activePopup(elmnt);
  }
}
function fadeOut(elmnt) {
  if (elmnt.classList.contains("fade")) {
    var opacity = 1;
    var timer = setInterval(function () {
      opacity -= 30 / 70;
      if (opacity <= 0) {
        clearInterval(timer);
        opacity = 0;
        elmnt.style.display = "none";
      }
      elmnt.style.opacity = opacity;
    }, 50);
  } else {
    elmnt.style.display = "none";
    activePopup(elmnt);
  }
}
function activePopup(elmnt) {
  for (let i = 0; i < popups.length; i++) {
    popups[i].classList.remove("popupActive");
  }
  elmnt.className += " popupActive";
}
function touchstart(e) {
  ehref = e.target.href;
  if (!timer) {
    timer = setTimeout(onlongtouch, touchduration);
  }
}
function touchend(e) {
  //stops short touches from firing the event
  if (timer) {
    clearTimeout(timer);
    ehref = "";
    timer = null;
  } else e.preventDefault();
}
onlongtouch = function () {
  timer = null;
  peek(true, ehref);
};

function rmhi(e) { //highlight using highlight.js
  let range = document.getSelection().getRangeAt(0);
  let preCaretRange = range.cloneRange();
  preCaretRange.selectNodeContents(e);
  preCaretRange.setEnd(range.endContainer, range.endOffset);
  caretOffset = preCaretRange.toString().length;
  e.innerText = e.innerText.replace(/\n/g, '⟂');
  hljs.highlightElement(e);
  e.innerHTML = e.innerHTML.replace(/⟂/g, '\n');
  for (let i = 0; i < caretOffset; i++)
    document.getSelection().modify("move", "forward", "character");
}

async function pouchSave(name, contents) {
  // let db = new PouchDB('_database',{revs_limit: 1, auto_compaction: true});
  let db = new PouchDB('_database');
  try {
    obj = await db.get(name);
  } catch (err) {
    try {
      await db.put(JSON.parse(JSON.stringify({ _id: name, contents: contents })));
    } catch (err) {
      let x = localStorage.getItem('errors'); localStorage.setItem('errors', name + 'save error: ' + err.message + '\n' + x)
    }
    return;
  }
  try {
    await db.put(JSON.parse(JSON.stringify({ _id: name, contents: contents, _rev: obj._rev })));
  } catch (err) {
    let x = localStorage.getItem('errors'); localStorage.setItem('errors', name + ' update error: ' + err.message + '\n' + x)
  }
};
async function pouchLoad(name) {
  // let db = new PouchDB('_database',{revs_limit: 1, auto_compaction: true});
  let db = new PouchDB('_database');
  let obj;
  try {
    obj = await db.get(name);
  } catch (err) {
    if (err.status != 404) {
      let x = localStorage.getItem('errors'); localStorage.setItem('errors', x + name + ' load error: ' + err + '\n')
    }
  }
  return obj;
};
async function pouchDelete(name) {
  // let db = new PouchDB('_database',{revs_limit: 1, auto_compaction: true});
  let db = new PouchDB('_database');
  let obj;
  try {
    obj = await db.get(name);
    await db.remove(obj);
    //parent.window.location.reload();
    parent.loadfile(name,parent.main,false);
  } catch (err) {
    if (err.status != 404) {
      let x = localStorage.getItem('errors'); localStorage.setItem('errors', x + name + ' load error: ' + err + '\n')
    }
  }
};
function resizeiframe(elmnt) {
  elmnt.style.height = elmnt.contentWindow.document.documentElement.scrollHeight + 'px';
  //alert(''+elmnt.scrollHeight)
  // elmnt.scrollTop='400px';
  //alert(''+obj.contentWindow.document.documentElement.scrollHeight)
  // elmnt.scrolltop=document.scrollingElement.scrollTop;
}

function test() {
}

