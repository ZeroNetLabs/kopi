class ZeroApp extends ZeroFrame

  #
  # When the ZeroNet page is loaded a websocket is openend.
  # This can be used to check if the user is logged in.
  #

  onOpenWebsocket: (e) ->
    @cmd "wrapperSetViewport", "width=device-width, initial-scale=1.0"
    @cmd "siteInfo", {}, (site_info) =>
      @site_info = site_info
      if site_info.cert_user_id
        @log "Logged in as #{site_info.cert_user_id}"
      else
        @log "Not Logged in."

  #
  # Messages received in real-time ara managed here.
  # It can be used to login the user once he selects a certificate.
  #

  route: (cmd, message) ->
    if cmd == "setSiteInfo"
      @site_info = message.params
      if message.params.cert_user_id
        @log "Logged in as #{message.params.cert_user_id}"
      else
        @log "Not Logged in."

  #
  # Displays the certificate selection dialog box to the user.
  #
  # Use it from your html files with an onclick attribute:
  # <a href="#" onclick="return Page.selectUser()">Login</a>
  #

  selectUser: =>
    Page.cmd "certSelect", [["zeroid.bit"]]
    return false

  #
  # Users have a quota or limit on the data they can post to each site.
  # This method gets the max_size allowed in this site and the current 
  # user's data size.
  #

  updateUserQuota: ->
    if @site_info.cert_user_id
      @cmd "fileRules", "data/users/#{@site_info.auth_address}/content.json", (rules) =>
        @log "Current size: #{rules.current_size} / Max size: #{rules.max_size}"


  #
  # ZeroNet includes an SQLite database you can use to query your application data.
  # This database is Read-Only.
  #

  queryData: ->

    # Join query to get all data from zeroapp with the corresponding user information
    #
    # query = """
    #           SELECT zeroapp.*, keyvalue.value AS cert_user_id FROM zeroapp
    #           LEFT JOIN json AS data_json USING (json_id)
    #           LEFT JOIN json AS content_json ON (
    #               data_json.directory = content_json.directory AND content_json.file_name = 'content.json'
    #           )
    #           LEFT JOIN keyvalue ON (keyvalue.key = 'cert_user_id' AND keyvalue.json_id = content_json.json_id)
    #           ORDER BY date_added
    #       """

    query = "SELECT * FROM zeroapp"
    @cmd "dbQuery", [query], (data) =>
      @log data

  #
  # JSON files are used to save or update the data in ZeroNet
  #

  saveData: =>

    # The user needs to be logged in in order to post some data to the site
    if not Page.site_info.cert_user_id
      Page.cmd "wrapperNotification", ["info", "Please, select your account."]
      return false

    # Path to the user's data file.
    inner_path = "data/users/#{@site_info.auth_address}/data.json"

    # Load the current user's data file and push a new element
    @cmd "fileGet", {"inner_path": inner_path, "required": false}, (data) =>
        if data
            data = JSON.parse(data)
        else
            data = { "zeroapp": [] }

        data.zeroappp.push({
            "body": document.getElementById("message").value,
            "date_added": (+new Date)
        })

        json_raw = unescape(encodeURIComponent(JSON.stringify(data, undefined, '\t')))

        # Write file to disk. All data posted by this user will be stored here.
        # ZeroNet will automatically map it into the SQLite database so we can
        # query it later.
        @cmd "fileWrite", [inner_path, btoa(json_raw)], (res) =>

          # Publish the file so other users can download it
          if res == "ok"
              @cmd "sitePublish", {"inner_path": inner_path}, (res) =>
                @log "Data published"
          else
              @cmd "wrapperNotification", ["error", "File write error: #{res}"]

    return false

window.Page = new ZeroApp()