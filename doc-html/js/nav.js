Nav = function() {
  
}
Nav.init = function(injectorCallback) {
  var overview = this.buildOverview(injectorCallback);
  this.addScrollListener(overview);
  this.addToggleBehaviours();
  this.addLinkBehaviours();
  
  this.addHelperMarkup();
  this.formatCode();
}

Nav.addHelperMarkup = function() {
  $("article > pre").each(function() {
    var $pre = $(this);
    var $prev = $pre.prev();

    $pre.wrap('<div class="pre-wrapper"></div>');
    $pre = $pre.closest(".pre-wrapper");

    if($prev[0] && $prev[0].nodeName.toLowerCase() == "p" && $prev.html().indexOf(":") == $prev.html().length-1) {
      var wrapper = $("<div class=\"code-pair\"></div>");
      $prev.before(wrapper);

      var pWrapper = $("<div class=\"text-container\"></div>");
      wrapper.append(pWrapper);
      pWrapper.append($prev);
      
      wrapper.append($pre); 
      wrapper.append("<div class=\"clearfix\"></div>")

    }
  });
};

Nav.formatCode = function() {
  $("code").each(function() {
    var $e = $(this);
    var code = $e.html();

    $e.html(code.replace(/\t/g, "  "));
  });
};

Nav.buildOverview = function(injectorCallback) {

  
  // Build the heading index
  var hTags = ["h1", "h2", "h3", "h4", "h5", "h6"];
  var hSel = hTags.join(", ");
  var hPrev, liPrev, target;
  
  // target is always a LIST and we're appending LI's to it
  var rootList = $("<ol class=\"h1\"></ol>");
  injectorCallback(rootList);  
  
  $(hSel, $("article")).each(function(index) {
    if(index == 0) {
      // Important: First heading ignored as it is the page heading
    }
    else {
      var $h = $(this);

      var newLi = $("<li class=\"hidden\"><a href=\"#"+$h.attr("id")+"\">"+$h.html()+"</a><ol></ol></li>");

      if(hPrev && (this.tagName == hPrev.tagName)) {
        // console.log("keeping scope: "+this.tagName+" ('"+$h.html()+"')");
      }
      else if(!hPrev || (this.tagName > hPrev.tagName)) {
        // Starting out or descending scope
        // console.log("entering scope: "+this.tagName+" ('"+$h.html()+"')");
        // Go to new target
        target = ($("ol", (liPrev)).length > 0)? $("ol", liPrev).first() : rootList;
        // Add toggler to previous target
        if(liPrev && hPrev) {
          liPrev.addClass("has-subtopics");
          $("a", liPrev).addClass("has-subtopics");
          liPrev.prepend("<a class=\"nav-toggle\" href=\"#\">+</a> ");
          target.addClass(this.tagName.toLowerCase())
          target.hide();
        }
      }
      else if(this.tagName < hPrev.tagName) {
        // console.log("exiting scope: "+this.tagName+" ('"+$h.html()+"')");
        // Exiting scope, determine how many exits we're making
        var prevT = target;
        target = target.closest("ol."+this.tagName.toLowerCase());
      }
      // Append to current scope
      target.append(newLi);
      // Set scope comparison flag
      hPrev = this;
      liPrev = newLi; 
    }
  });
  
  return rootList;
}

Nav.addToggleBehaviours = function() {
  // Build togglers
  $("a.nav-toggle").click(function(e) {
    var $a = $(this);
    var $li = $a.closest("li");
    
    if($li.hasClass("hidden")) {
      Nav.expandTree($li);
      $li.addClass("manual");
    }
    else {
      $li.removeClass("manual");
      Nav.collapseTree($li);
    }    
    e.preventDefault();
    return false;
  });
}

Nav.expandTree = function(li) {
  var $li = $(li);
  $li.removeClass("hidden");
  $li.addClass("shown");
  var sublist = $li.children("ol");
  if(sublist.children("li").length > 0) {
    sublist.slideDown(250);
  }
  $li.children("a.nav-toggle").html("-");
}

Nav.collapseTree = function(li) {
  var $li = $(li);
  if($li.hasClass("manual")) return;
  $li.removeClass("shown");
  $li.addClass("hidden");
  $li.children("ol").slideUp(250);
  $li.children("a.nav-toggle").html("+");
}

Nav.addLinkBehaviours = function() {
  $("a[href^='#']:not(.nav-toggle)").click(function(event) {
    var dest = $(this).attr("href");  
    if(dest!="#") {
      Nav.navigate(dest);    
      // Kill actual link behaviour
      event.preventDefault();
      return false;
    }
  });
}

Nav.scrollTarget = null;
Nav.navigate = function(dest) {  
  // Scroll main content view
  Nav.scrollTarget = dest;
  $.scrollTo($(dest), 500, {onAfter: function() {
    document.location = document.location.toString().split("#")[0]+dest;
    Nav.scrollTarget = null;
  }});
}

Nav.makeDestinationCurrent = function(dest, hNav) {
  var navLi = $("nav a[href='"+dest+"']").parents("li");
  navLi.addClass("current");
  // Collapse all nav trees that aren't a part of this
  var navItems = $("li", hNav);
  navItems.each(function(i) {
    var $item = $(this);
    // If this list item contains a link to the destination, we expand it
    // Else we collapse it
    if($("a[href='"+dest+"']", $item).length > 0) {
      Nav.expandTree(this);
    }
    else {
      Nav.collapseTree(this);
    }
  });
}

Nav.addScrollListener = function(hNav) {
  $(window).scroll(function(event) {
    // Find the first visible header and highlight it as current in the nav
    var docViewTop = $(window).scrollTop();
    var docViewBottom = docViewTop + $(window).height();
    
    // Strip current classes
    $("li", hNav).removeClass("current");
    
    // Find first visible header and if no header is visible, find closest to document top
    // OR take the current async scroll target first
    if(Nav.scrollTarget) {
      Nav.makeDestinationCurrent(Nav.scrollTarget, hNav);
    }
    else {
      var lastAboveFrameHeader;
      $("h1:not(h1:first-child), h2, h3, h4, h5, h6", $("article")).each(function(i) {
        var $elem = $(this);
        var elemTop = $elem.offset().top;
        var elemBottom = elemTop + $elem.height();

        var aboveFrame = (elemBottom < docViewTop);
        var belowFrame = (elemTop > docViewBottom);
        var inFrame = (!aboveFrame && !belowFrame);

        if(aboveFrame) {
          // Above frame, store in fallback pointer
          lastAboveFrameHeader = $elem;
        }
        else if(belowFrame && lastAboveFrameHeader) {
          // If we went below frame, run action against last aboveFrame header
          Nav.makeDestinationCurrent("#"+lastAboveFrameHeader.attr("id"), hNav);
          return false;
        }
        else if(inFrame) {
          // If in frame, this is the badger
          Nav.makeDestinationCurrent("#"+$elem.attr("id"), hNav);
          return false;
        }
      }); 
    }
  });
}



