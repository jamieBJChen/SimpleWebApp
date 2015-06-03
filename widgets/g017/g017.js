function g017(userid, htmlid) {
    "user strict";
    
    /*
     * Model
     */
    var model = {
        
        views:[],
        course:{subject:null, catalog:null},
        
        addView: function (view) {
            this.views.push(view);
        },
        
        notifyViews: function () {
            var i = 0;
            for (i = 0; i < this.views.length; i++) {
                this.views[i](this.course.subject, this.course.catalog);
            }
        },
        
        loadCourseData: function (subject) {
            this.course.subject = subject;
            this.course.catalog = null;
            $.getJSON("https://api.uwaterloo.ca/v2/courses/" + subject + ".json?key=dd52f57dc79ca1ef3b3650696b8cafde",
                    function (d) {
						$("#g017_catalog option").remove();
                        if (d.meta.status === 200) {
                            var i;
                            var cs = $("#g017_catalog");
							var opt_first = "<option value='- - - - - -'>- - - - - -</option>";
                    		cs.append(opt_first);
                            for(i=0; i<d.data.length; i++){
                                var cn = d.data[i].catalog_number;
                                var opt = "<option value='" + cn + "'>" + cn + "</option>";
                                cs.append(opt);
                            }
                        }
                    }
            );
            this.notifyViews();
        },
        
        addCatalog: function (catalog_num) {
            this.course.catalog = catalog_num;
            this.notifyViews();
        }
        
    };
    
    /*
     * View
     */
    var view = {
        
        updateView: function(sub, cat){
            var msg = sub+"/"+cat;
            $.getJSON("https://api.uwaterloo.ca/v2/courses/" + msg + "/schedule" + ".json?key=dd52f57dc79ca1ef3b3650696b8cafde",
				function(d){
					
                    for (; $("table tr").length > 1;){
                      $("table tr:last").remove();
					}
					if (d.meta.status == 200) {
                        var i;
						for(i=0; i<d.data.length; i++){
							if (d.data[i].section.substr(0, 3) == "TST") continue;
							var j;
							for(j=0; j<d.data[i].classes.length; j++){
                                var dataRow = "<tr>";
								dataRow += "<td>"+d.data[i].section+"</td>";
								var classes = d.data[i].classes[j];
                                if (classes.dates.start_time != null){
                                    dataRow += "<td>"+classes.dates.start_time+"-"+classes.dates.end_time+" "+classes.dates.weekdays+"</td>";
                                }
                                else {
                                    dataRow += "<td></td>";
                                }
								if (classes.location.building != null){
									dataRow += "<td>"+"<button id='"+classes.location.building+i+j+"' value='"+classes.location.building+ "'>"+classes.location.building+"</button>"+classes.location.room+"</td>";
								}
                                else {
                                    dataRow += "<td></td>";
                                }
								var k;
								dataRow += "<td>";
								for (k=0; k<classes.instructors.length; k++){
									if (k!=0){
										 dataRow += "\n"
									}
									dataRow += classes.instructors[k];
								}
								dataRow += "</td>";
                                dataRow += "</tr>";
                                $("table tr:last").after(dataRow);
                                $("#"+classes.location.building+i+j).on('click',
                                        function(){
                                            $.getJSON("https://api.uwaterloo.ca/v2/buildings/" + this.value + ".json?key=dd52f57dc79ca1ef3b3650696b8cafde",
                                                function(d){
                                                    $("iframe").attr('src', "https://a.tiles.mapbox.com/v3/kkzylom.gd9jpa14.html?secure=1#17/"+d.data.latitude+"/"+d.data.longitude);
                                            });
                                });
							}
						}
					}
				}
			);
        },
        
        initView: function(){
            console.log("Initializing courseView");
            model.addView(this.updateView);
            $("#g017_subject").on("change", function(){
                model.loadCourseData($(this).val().toLowerCase());
            });
			$("#g017_catalog").on("change", function(){
				model.addCatalog($(this).val().toLowerCase());
			});
        },
        
    };
    
    /*
     * Initialize the widget.
     */
    console.log("Initializing g017(" + userid + ", " + htmlid + ")");
    portal.loadTemplates("widgets/g017/templates.json",
                         function (t) {
                         $(htmlid).html(t.baseHtml);
                         });
    $("#g017").css("color", "blue");
    $.getJSON("https://api.uwaterloo.ca/v2/codes/subjects" + ".json?key=dd52f57dc79ca1ef3b3650696b8cafde",
              function(d){
                if (d.meta.status == 200) {
                    var i;
                    var ss = $("#g017_subject");
                    var opt_load = "<option value='loading'>loading:0%</option>";
                    ss.append(opt_load);
                    var dlen = d.data.length;
                    var loadNum = 0;
                    var subjectArray = new Array();
                    subjectArray.push("- - - - - -");
                    $("#g017_cDescr").append("Question: why not providing a method that can get all the available subjects for a specific term?");
              
                    for(i=0; i<dlen; i++){
                        var sub = d.data[i].subject;
						var print = true;
						$.getJSON("https://api.uwaterloo.ca/v2/terms/1139/" + sub.toLowerCase() + "/schedule.json?key=dd52f57dc79ca1ef3b3650696b8cafde",
							function(d){
                                loadNum += 1.0;
                                  var divideNum = loadNum / dlen * 100;
                                $("#g017_subject option").remove();
                                opt_load = "<option value='loading'>loading:" + parseInt(divideNum) + "%</option>";
                                ss.append(opt_load);
								if (d.data.length>0) {
                                  subjectArray.push(d.data[0].subject);
								}
                                  
                                if (parseInt(loadNum) == dlen){
                                  $("#g017_cDescr").remove();
                                  subjectArray.sort();
                                  $("#g017_subject option").remove();
                                  for (i=0; i<subjectArray.length; i++){
                                    var opt = "<option value='" + subjectArray[i] + "'>" + subjectArray[i] + "</option>";
                                    ss.append(opt);
                                  }
                                  view.initView();
                                }
						});
                    }
                } else {
                    model.course = {};
                    model.notifyViews("subject_error");
                    console.log("Failed to read subject data." + JSON.stringify(d.meta));
                }
              }
    );
}

