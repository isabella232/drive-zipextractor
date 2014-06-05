var driveapi={};driveapi.IS_NATIVE_BIND_=Function.prototype.bind&&Function.prototype.bind.toString().indexOf("native code")!=-1;driveapi.bindFn=function(e,t,n){if(driveapi.IS_NATIVE_BIND_){return e.call.apply(e.bind,arguments)}else{if(arguments.length>2){var r=Array.prototype.slice.call(arguments,2);return function(){var n=Array.prototype.slice.call(arguments);Array.prototype.unshift.apply(n,r);return e.apply(t,n)}}else{return function(){return e.apply(t,arguments)}}}};driveapi.AppConfig=function(e){this.clientId_=e.clientId;this.appId_=e.appId;this.scopes_=e.scopes;this.apiKey_=e.apiKey};driveapi.AppConfig.prototype.getClientId=function(){return this.clientId_};driveapi.AppConfig.prototype.getAppId=function(){return this.appId_};driveapi.AppConfig.prototype.getScopes=function(){return this.scopes_};driveapi.AppConfig.prototype.getApiKey=function(){return this.apiKey_};driveapi.AuthManager=function(e){this.appConfig_=e};driveapi.AuthManager.prototype.authorize=function(e,t,n){var r={client_id:this.appConfig_.getClientId(),scope:this.appConfig_.getScopes(),immediate:e};if(n){r["login_hint"]=n}try{gapi.auth.authorize(r,t)}catch(i){var s={};s.error=i;t(s)}};driveapi.AuthManager.prototype.getToken=function(){return gapi.auth.getToken()};driveapi.AuthManager.prototype.getAccessToken=function(){var e=this.getToken();return e?e.access_token:null};driveapi.FileManager=function(e){this.authManager_=e;this.activeRequests_=[]};driveapi.FileManager.ErrorType={FORBIDDEN:"forbidden",FILE_NOT_FOUND:"fileNotFound",DEADLINE_EXCEEDED:"deadlineExceeded",SERVER_ERROR:"serverError",AUTH_ERROR:"authError",BAD_REQUEST:"badRequest",REQUEST_ABORTED:"requestAborted",UNKNOWN:"unknown"};driveapi.FileManager.ErrorMessage={FORBIDDEN:"There were too many recent requests; please wait a while and try again.",FILE_NOT_FOUND:"Unable to find the specified file; please check that it exists and try again.",DEADLINE_EXCEEDED:"The server took too long to respond; please try again.",SERVER_ERROR:"An internal server error occurred; please try again.",AUTH_ERROR:"An authorization error occured; please refresh this page and re-authorize.",BAD_REQUEST:"The server request could not be understood; please try again or report this error to the developers.",REQUEST_ABORTED:"The user canceled the request when it was still in progress.",UNKNOWN:"An unknown error occurred; please try again or report this error to the developers."};driveapi.FileManager.ApiUrl_={UPLOAD:"https://www.googleapis.com/upload/drive/v2/files/",STANDARD:"https://www.googleapis.com/drive/v2/files/"};driveapi.FileManager.Method_={POST:"POST",GET:"GET",PUT:"PUT"};driveapi.FileManager.CallbackType_={SUCCESS:"success",ERROR:"error",PROGRESS:"progress",ABORT:"abort"};driveapi.FileManager.MimeType_={JSON:"application/json",FOLDER:"application/vnd.google-apps.folder"};driveapi.FileManager.XhrResponseType_={BLOB:"blob",JSON:"json"};driveapi.FileManager.CRLF_="\r\n";driveapi.FileManager.MULTIPART_BOUNDARY_="-------314159265358979323846";driveapi.FileManager.MULTIPART_DELIMITER_=driveapi.FileManager.CRLF_+"--"+driveapi.FileManager.MULTIPART_BOUNDARY_+driveapi.FileManager.CRLF_;driveapi.FileManager.MULTIPART_CLOSE_DELIMITER_=driveapi.FileManager.CRLF_+"--"+driveapi.FileManager.MULTIPART_BOUNDARY_+"--";driveapi.FileManager.MULTIPART_CONTENT_TYPE_='multipart/mixed; boundary="'+driveapi.FileManager.MULTIPART_BOUNDARY_+'"';driveapi.FileManager.prototype.generateCallbacks=function(e,t,n,r){var i={};i[driveapi.FileManager.CallbackType_.SUCCESS]=e;i[driveapi.FileManager.CallbackType_.ERROR]=t;i[driveapi.FileManager.CallbackType_.PROGRESS]=n;i[driveapi.FileManager.CallbackType_.ABORT]=r;return i};driveapi.FileManager.prototype.abortAllRequests=function(){var e=this.activeRequests_.slice(0);for(var t=0;t<e.length;t++){var n=e[t];if(n&&n.abort){n.abort()}}};driveapi.FileManager.prototype.abortDownload=function(){var e=this.getDownloadXhr_();if(e){e.abort()}};driveapi.FileManager.prototype.getDownloadXhr_=function(){return this.activeRequests_.length>0?this.activeRequests_[0]:null};driveapi.FileManager.prototype.get=function(e,t){this.sendXhr_(driveapi.FileManager.Method_.GET,driveapi.FileManager.ApiUrl_.STANDARD+e,{},undefined,driveapi.FileManager.MimeType_.JSON,driveapi.FileManager.XhrResponseType_.JSON,t)};driveapi.FileManager.prototype.download=function(e,t,n){var r=this.generateCallbacks(driveapi.bindFn(this.handleDownloadResponse_,this,t,n),n[driveapi.FileManager.CallbackType_.ERROR],undefined,n[driveapi.FileManager.CallbackType_.ABORT]);this.get(e,r)};driveapi.FileManager.prototype.handleDownloadResponse_=function(e,t,n){if(!n){this.invokeCallback_(t,driveapi.FileManager.CallbackType_.ERROR,driveapi.FileManager.ErrorType.UNKNOWN);return}e(n);this.downloadFile(n,t)};driveapi.FileManager.prototype.downloadFile=function(e,t){var n=t[driveapi.FileManager.CallbackType_.SUCCESS];t[driveapi.FileManager.CallbackType_.SUCCESS]=driveapi.bindFn(n,this,e);this.sendXhr_(driveapi.FileManager.Method_.GET,e.downloadUrl,{},undefined,undefined,driveapi.FileManager.XhrResponseType_.BLOB,t)};driveapi.FileManager.prototype.insertBlob=function(e,t,n,r){this.blobToBase64_(e,driveapi.bindFn(this.insertFileAsBase64_,this,t,n,r))};driveapi.FileManager.prototype.insertFileAsBase64_=function(e,t,n,r){var i=this.generateDriveFileMetadata_(e,t);var s=driveapi.FileManager.MULTIPART_DELIMITER_+"Content-Type: "+driveapi.FileManager.MimeType_.JSON+driveapi.FileManager.CRLF_+driveapi.FileManager.CRLF_+JSON.stringify(i)+driveapi.FileManager.MULTIPART_DELIMITER_+"Content-Transfer-Encoding: base64"+driveapi.FileManager.CRLF_+driveapi.FileManager.CRLF_+r+driveapi.FileManager.MULTIPART_CLOSE_DELIMITER_;this.sendXhr_(driveapi.FileManager.Method_.POST,driveapi.FileManager.ApiUrl_.UPLOAD,{uploadType:"multipart"},s,driveapi.FileManager.MULTIPART_CONTENT_TYPE_,driveapi.FileManager.XhrResponseType_.JSON,n)};driveapi.FileManager.prototype.insertFolder=function(e,t,n){var r=this.generateDriveFileMetadata_(e,t,driveapi.FileManager.MimeType_.FOLDER);this.sendXhr_(driveapi.FileManager.Method_.POST,driveapi.FileManager.ApiUrl_.STANDARD,{},JSON.stringify(r),driveapi.FileManager.MimeType_.JSON,driveapi.FileManager.XhrResponseType_.JSON,n)};driveapi.FileManager.prototype.sendXhr_=function(e,t,n,r,i,s,o){var u=new XMLHttpRequest;this.activeRequests_.push(u);var a=this;u.onreadystatechange=function(e){if(u.readyState==4){a.removePendingXhr_(u);if(u.status==200&&u.response){var t=u.response;if(u.responseType===""&&typeof u.response==="string"){t=JSON.parse(u.response)}a.invokeCallback_(o,driveapi.FileManager.CallbackType_.SUCCESS,t)}else if(u.status===0||u.status===200&&!u.response){var n=a.getErrorMessage_(driveapi.FileManager.ErrorType.REQUEST_ABORTED);a.invokeCallback_(o,driveapi.FileManager.CallbackType_.ABORT,n)}else{var r=a.getErrorFromXhrStatus_(u.status);a.invokeCallback_(o,driveapi.FileManager.CallbackType_.ERROR,r,a.getErrorMessage_(r))}}};if(o[driveapi.FileManager.CallbackType_.PROGRESS]){var f=function(e){if(e&&e.lengthComputable){var t=e.position||e.loaded;var n=e.totalSize||e.total;a.invokeCallback_(o,driveapi.FileManager.CallbackType_.PROGRESS,t,n)}};if(e==driveapi.FileManager.Method_.GET){u.onprogress=f}else{u.upload.onprogress=f}}if(o[driveapi.FileManager.CallbackType_.ERROR]){u.onerror=function(e){var t=a.getErrorFromXhrStatus_(u.status);var n=a.getErrorMessage_(t);n+=" ["+u.statusText+"]";if(e&&e.error){n+=" - "+e.error}a.removePendingXhr_(u);a.invokeCallback_(o,driveapi.FileManager.CallbackType_.ERROR,t,a.getErrorMessage_(t))}}var l=this.buildCorsUrl_(t,n);u.open(e,l,true);u.responseType=s;u.setRequestHeader("Authorization","Bearer "+this.authManager_.getAccessToken());if(i){u.setRequestHeader("Content-Type",i)}u.send(r)};driveapi.FileManager.prototype.generateDriveFileMetadata_=function(e,t,n){var r={title:e};if(t){r.parents=[{id:t}]}if(n){r.mimeType=n}return r};driveapi.FileManager.prototype.buildCorsUrl_=function(e,t){var n=e;var r=this.buildQuery_(t);if(r){n+="?"+r}return n};driveapi.FileManager.prototype.buildQuery_=function(e){e=e||{};return Object.keys(e).map(function(t){return encodeURIComponent(t)+"="+encodeURIComponent(e[t])}).join("&")};driveapi.FileManager.prototype.removePendingXhr_=function(e){var t=this.activeRequests_.indexOf(e);if(t!=-1){this.activeRequests_.splice(t,1)}};driveapi.FileManager.prototype.invokeCallback_=function(e,t,n,r){var i=e[t];if(i){i(n,r)}};driveapi.FileManager.prototype.getErrorFromXhrStatus_=function(e){switch(e){case 403:return driveapi.FileManager.ErrorType.FORBIDDEN;case 404:return driveapi.FileManager.ErrorType.FILE_NOT_FOUND;case 500:return driveapi.FileManager.ErrorType.SERVER_ERROR;case 503:return driveapi.FileManager.ErrorType.DEADLINE_EXCEEDED;case 401:return driveapi.FileManager.ErrorType.AUTH_ERROR;case 400:return driveapi.FileManager.ErrorType.BAD_REQUEST;case 0:return driveapi.FileManager.ErrorType.REQUEST_ABORTED;default:return driveapi.FileManager.ErrorType.UNKNOWN}};driveapi.FileManager.prototype.getErrorMessage_=function(e){switch(e){case driveapi.FileManager.ErrorType.FORBIDDEN:return driveapi.FileManager.ErrorMessage.FORBIDDEN;case driveapi.FileManager.ErrorType.FILE_NOT_FOUND:return driveapi.FileManager.ErrorMessage.FILE_NOT_FOUND;case driveapi.FileManager.ErrorType.SERVER_ERROR:return driveapi.FileManager.ErrorMessage.SERVER_ERROR;case driveapi.FileManager.ErrorType.DEADLINE_EXCEEDED:return driveapi.FileManager.ErrorMessage.DEADLINE_EXCEEDED;case driveapi.FileManager.ErrorType.AUTH_ERROR:return driveapi.FileManager.ErrorMessage.AUTH_ERROR;case driveapi.FileManager.ErrorType.BAD_REQUEST:return driveapi.FileManager.ErrorMessage.BAD_REQUEST;case driveapi.FileManager.ErrorType.REQUEST_ABORTED:return driveapi.FileManager.ErrorMessage.REQUEST_ABORTED;default:return driveapi.FileManager.ErrorMessage.UNKNOWN}};driveapi.FileManager.prototype.blobToBase64_=function(e,t){var n=new FileReader;n.onload=function(){var e=n.result;var r=e.split(",")[1];t(r)};n.readAsDataURL(e)};driveapi.UrlStateParser=function(){this.state_=null};driveapi.UrlStateParser.prototype.getState=function(){if(!this.state_){this.parseState()}return this.state_};driveapi.UrlStateParser.prototype.parseState=function(){var e=this.getUrlParam_("state");this.state_=e?JSON.parse(e):{}};driveapi.UrlStateParser.prototype.getFolderId=function(){return this.getState().folderId};driveapi.UrlStateParser.prototype.getAction=function(){return this.getState().action};driveapi.UrlStateParser.prototype.getFileId=function(){var e=this.getState().ids;if(!e){return null}return e.length&&e.length>0?e[0]:null};driveapi.UrlStateParser.prototype.isForCreateNew=function(){return this.getAction()!="open"&&!this.getFileId()};driveapi.UrlStateParser.prototype.isForOpen=function(){return this.getAction()=="open"&&!!this.getFileId()};driveapi.UrlStateParser.prototype.getUrlParam_=function(e){e=e.replace(/[\[]/,"\\[").replace(/[\]]/,"\\]");var t=new RegExp("[\\?&]"+e+"=([^&#]*)"),n=t.exec(location.search);return n===null?"":decodeURIComponent(n[1].replace(/\+/g," "))}