
// 폴더로 select 객체를 채움.
function init_bookmark_folders(){
  var temp_select_list = $('<select id="bookmark-folder">');
  chrome.bookmarks.getTree(function(bookmarkTreeNodes){
    var folder_list = traverseBookmarks(bookmarkTreeNodes, temp_select_list);
    $(".input-wrapper").append(folder_list);
  });
  temp_select_list.change(function (){
    get_cache();
    dumpBookmarks($("#bookmark-folder option:selected").val());
    set_init_event();  
  });
}

// 폴더만 option에 넣고 select 객체로 반환
function traverseBookmarks(bookmarkTreeNodes, temp_select_list) {
  for(var i=0;i<bookmarkTreeNodes.length;i++) {
    if(bookmarkTreeNodes[i].children) {
      if(bookmarkTreeNodes[i].title != ""){
        var option = $('<option>');
        option.attr("value", bookmarkTreeNodes[i].title);
        option.text(bookmarkTreeNodes[i].title);
        temp_select_list.append(option);
      }
      traverseBookmarks(bookmarkTreeNodes[i].children, temp_select_list);
    } 
  }
  return temp_select_list
}

// cache를 통해 data를 불러오기
function get_cache(){
  chrome.storage.sync.get(function(data){
    $("#bookmark-folder option:selected").val(data.bookmark_folder);
  });
}

function set_init_event(){
  get_cache();
  dumpBookmarks($("#bookmark-folder option:selected").val());

  $('#bookmark-folder').on('change', function () {
    $('#bookmarks').empty();
    dumpBookmarks($("#bookmark-folder option:selected").val());
    // 변경이 있을 때마다 저장하기
    chrome.storage.sync.set({
      "bookmark_folder": $("#bookmark-folder option:selected").val()
    });
  });
}

function dumpBookmarks(query) {
  var bookmarkTreeNodes = chrome.bookmarks.getTree(
    function(bookmarkTreeNodes) {
      dumpTreeNodes(bookmarkTreeNodes, query);
    });
}

function dumpTreeNodes(bookmarkNodes, query) {
  for (var i=0;i < bookmarkNodes.length;++i) {
    if(String(bookmarkNodes[i].title).indexOf(query) != -1){
      chrome.bookmarks.getChildren(bookmarkNodes[i].id, function(childs){
        for(var c=0;c<childs.length;++c){
          var bookmarks = $("#bookmarks");
          var list = $('<ul>');
          if(childs[c].url){ // sub-folder는 제외
            list.append(dumpNode(childs[c]));
          }
          bookmarks.append(list);
        }
      });
    }
    if(bookmarkNodes[i].children && bookmarkNodes[i].children.length > 0){
      dumpTreeNodes(bookmarkNodes[i].children, query);
    }
  }
}

function dumpNode(bookmarkNode){
  var anchor = $('<a>');
  anchor.attr('href', bookmarkNode.url);
  anchor.text(bookmarkNode.title);
  anchor.click(function() {
    chrome.tabs.create({url: bookmarkNode.url});
  });
  var span = $('<span>');
  span.append(anchor);
  var li = $(bookmarkNode.title ? '<li>' : '<div>').append(span);
  return li;
}



document.addEventListener('DOMContentLoaded', function () {
  $('#bookmarks').empty();
  init_bookmark_folders();
});
