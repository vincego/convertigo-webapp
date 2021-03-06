jQuery().ready(function() {
	var authToken = location.hash.match(new RegExp("#authToken=(.*)"));
	
	if (authToken != null) {
		authenticate({authToken: authToken[1]});
	} else {
		checkAuthentication();
	}
	
    $(".index").show();

	$("#FieldConvAdminUserLogin").focus();

	$("#dlgAuthFailed").dialog( {
		autoOpen : false,
		title : "Error",
		modal : true,
		buttons : {
			Ok : function() {
				$(this).dialog('close');
				return false;
			}
		}
	});

	$("#loginForm").submit(function() {
		authenticate({
			authUserName: $("#FieldConvAdminUserLogin").val(),
			authPassword: $("#FieldConvAdminUserPassword").val()
		});
		return false;
	});
});

function checkAuthentication() {
	$.ajax( {
		type : "POST",
		url : "services/engine.CheckAuthentication",
		dataType : "xml",
		data : {},
		success : function(xml) {
			var $xml = $(xml);
			var $authenticated = $xml.find("authenticated");
			if ($authenticated.text() == "true") {
				document.location.href = "main.html";
			}
		}
	});
}

function authenticate(data) {
	data.authType = "login";
	
	request = $.ajax( {
		type : "POST",
		url : "services/engine.Authenticate",
		data : data,
		dataType : "xml",
		success : function(xml) {
			var $xml = $(xml);
			if ($xml.find("success").length > 0) {
				location = $("form").attr("action");
			} else {
				$("#dlgAuthFailed_message").html($xml.find("error").text().replace(/\n/g, "<br/>"));
				$("#dlgAuthFailed").dialog('open');
			};
		}
	});
}
