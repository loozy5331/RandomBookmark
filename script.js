
// Array를 무작위로 섞어줌. 동작은 분석해봐야 함.
Array.prototype.shuffle = function(){
  return this.concat().sort(
    function(){return Math.random() - Math.random();}
  );
}

// chrome.bookmark로 북마크 폴더들을 불러오기
function getBookmark_folders(){
  return new Promise(function(resolve, reject){
    chrome.bookmarks.getTree(function(bookmarkTreeNodes){
      var temp_select_list = $('<select id="bookmark-folder">');
      var folder_list = traverseBookmarks(bookmarkTreeNodes, temp_select_list);
      $(".bookmark-folders").append(folder_list);
      resolve()
    })
  });
}

// chrome.storage.sync를 통해 Cache로 저장되어있던 bookmark_folder와 bookmark_num 정보를 가져오고,
// bookmark-contents에 해당 bookmark_folder에 있는 링크들을 dump 함.
function get_choosen_cache(){
  return new Promise(function(resolve, reject){
    chrome.storage.sync.get((data)=>{
      resolve(data.bookmark_folder);
      $('#bookmark-folder option[value=' + data.bookmark_folder + ']').prop("selected", true);
      $('#bookmark-num option[value=' + data.bookmark_num + ']').prop("selected", true);
    })
  });
}

// bookmark-folder가 바뀔 때마다 내용을 변경하는 이벤트 적용.
function add_bookmark_folder_change(){
  $('.bookmark-folders').change(function () {
    $('.bookmark-contents').empty();
    dumpBookmarks($("#bookmark-folder option:selected").val());

    chrome.storage.sync.set({
      "bookmark_folder": $("#bookmark-folder option:selected").val()
    });
  });
}

function add_bookmark_num_change(){
  $('.bookmark-nums').change(function(){
    $('.bookmark-contents').empty();
    dumpBookmarks($("#bookmark-folder option:selected").val());

    chrome.storage.sync.set({
      "bookmark_num": $("#bookmark-num option:selected").val()
    });
  });
}


// bookmark에서 폴더만 option에 넣고 select 객체로 반환
function traverseBookmarks(bookmarkTreeNodes, temp_select_list) {
  for(var bookmarkNode of bookmarkTreeNodes) {
    if(bookmarkNode.children) {
      if(bookmarkNode.title != ""){
        var option = $('<option>');
        option.attr("value", bookmarkNode.title);
        option.text(bookmarkNode.title);
        temp_select_list.append(option);
      }
      traverseBookmarks(bookmarkNode.children, temp_select_list);
    } 
  }
  return temp_select_list
}

// folder_name에 해당하는 링크들을 가져온다.
function dumpBookmarks(folder_name) {
  chrome.bookmarks.getTree(
    function(bookmarkTreeNodes) {
      dumpTreeNodes(bookmarkTreeNodes, folder_name);
    });
}

function dumpTreeNodes(bookmarkNodes, folder_name) {
  for (var bookmarkNode of bookmarkNodes) {
    if(String(bookmarkNode.title).indexOf(folder_name) != -1){
      chrome.bookmarks.getChildren(bookmarkNode.id, function(childs){
        var bookmark_contents = $(".bookmark-contents");
        var bookmark_num = parseInt($("#bookmark-num").val());
        var list = $('<ul>');
        var temp_list = [];
        for(var child of childs)
          if(child.url) temp_list.push(dumpNode(child));  // sub-folder는 제외 
        
        temp_list = temp_list.shuffle();                  // 섞어줌.
        for(var j in temp_list){
          if(j < bookmark_num) list.append(temp_list[j]); // bookmark_num 보다 작으면 전부 넣고, 아니면 bookmark_num까지.
        }
        bookmark_contents.append(list);
      });
    }
    else if(bookmarkNode.children && bookmarkNode.children.length > 0){
      dumpTreeNodes(bookmarkNode.children, folder_name);
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


// 폴더로 select 객체를 채움.
function main(){
  getBookmark_folders().then(get_choosen_cache).then(dumpBookmarks);
  add_bookmark_folder_change();
  add_bookmark_num_change();
}

document.addEventListener('DOMContentLoaded', function () {
  $('.bookmark-contents').empty();
  main();
});
