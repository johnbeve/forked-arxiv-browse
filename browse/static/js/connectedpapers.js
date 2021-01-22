(function () {

  const $output = $('#connectedpapers-output');

  if ($output.html() != '') {
    // Toggled off
    $output.html('');
    return;
  }

  const script_path = document.getElementById('connectedpapers-toggle').attributes["data-script-url"].value;
  const script_dir = script_path.substr(0, script_path.lastIndexOf('/'));

  const css_loader = '<link rel="stylesheet" type="text/css" href="' + script_dir + '/connectedpapers.css"/>';
  const loading_html = '<p>Loading...</p>';
  
  $output.html(css_loader + loading_html);


  const REST_ADDR = 'https://rest.migration.connectedpapers.com/';
  const CONNECTED_PAPERS_ADDR = 'https://www.connectedpapers.com/';
  const ARXIV_THUMBNAILS_ADDR = CONNECTED_PAPERS_ADDR + 'arxiv_thumbnails/';
  const NUMBER_OF_THUMBNAILS = 18;
  
  const arxivId = window.location.pathname.split('/').reverse()[0];
  const arxivIdToCPIdUrl = REST_ADDR + '?arxiv=' + arxivId;
  const communicationErrorHtml = '<p>Oops, seems like communication with the Connected Papers server is down.</p>';
  const idNotRecognizedHtml = '<p>Seems like this paper is still not in our database. Please try again in a few' +
                              ' days.</p>';
  
  
  $.get(arxivIdToCPIdUrl).done(translationResponse => {
    if ($output.html() == '') {
      // Toggled off
      return;
    }
    if (translationResponse == null) {
      $output.html(css_loader + idNotRecognizedHtml);
      return;
    }
    const paperId = translationResponse.paperId;
    const title = translationResponse.title;

    if (paperId.length == 0 || title.length == 0) {
      $output.html(css_loader + idNotRecognizedHtml);
      return;
    }

    const versionsFetchUrl = REST_ADDR + '?versions=' + paperId;

    $.get(versionsFetchUrl).done(versionsResponse => {
      if ($output.html() == '') {
        // Toggled off
        return;
      }

      const graphUrl = CONNECTED_PAPERS_ADDR + 'main/' + paperId + '/arxiv';
      
      const buildGraphLinkHtml = '<p class="connectedpapers-title">' + title '</p>';
      
      // Future compatible support for different messages for existing and nonexisting graphs
      const seeGraphLinkHtml = buildGraphLinkHtml;
      const graphNotVisual = '<p>Seems like this paper is still not in our database. Please try again in a few' +
                             ' days.</p>';

      // A string to int hash algorithm
      // https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript
      function cyrb53(str, seed = 0) {
        let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
        for (let i = 0; i < str.length; i++) {
          let ch = str.charCodeAt(i);
          h1 = Math.imul(h1 ^ ch, 2654435761);
          h2 = Math.imul(h2 ^ ch, 1597334677);
        }
        h1 = Math.imul(h1 ^ (h1>>>16), 2246822507) ^ Math.imul(h2 ^ (h2>>>13), 3266489909);
        h2 = Math.imul(h2 ^ (h2>>>16), 2246822507) ^ Math.imul(h1 ^ (h1>>>13), 3266489909);
        return 4294967296 * (2097151 & h2) + (h1>>>0);
      };

      const selected_thumbnail_num = Math.abs(cyrb53(arxivId)) % NUMBER_OF_THUMBNAILS;

      const chosenGraph = ARXIV_THUMBNAILS_ADDR + 'g' + selected_thumbnail_num + '.jpg';
      const chosenGraphHtml = '<img src="' + chosenGraph + '" alt="Example graph image" width="140" height="120"' +
                              ' class="connectedpapers-img">';

      const infoLine = '<p class="connectedpapers-info-line">See related papers to:</p>';

      const textDivOpen = '<div class="connectedpapers-text-cont">';
      const buildGraphTextDiv = textDivOpen + infoLine + buildGraphLinkHtml + '</div>';
      const seeGraphTextDiv = textDivOpen + infoLine + seeGraphLinkHtml + '</div>';

      const buildGraphHtml = '<div class="connectedpapers-width-limiter"><a class="connectedpapers-link" href="' +
                             graphUrl + '" target="_blank"><div class="connectedpapers-container">' + chosenGraphHtml +
                             buildGraphTextDiv + '</div></a></div>';

      const seeGraphHtml = '<div class="connectedpapers-width-limiter"><a class="connectedpapers-link" href="' +
                           graphUrl + '" target="_blank"><div class="connectedpapers-container">' + chosenGraphHtml +
                           seeGraphTextDiv + '</div></a></div>';

      if (versionsResponse == null) {
        // Graph not yet built ever
        $output.html(css_loader + buildGraphHtml);
        return;
      }
      const versionsData = versionsResponse.result_dates;
      if (versionsData.length == 0) {
        // Graph not yet built ever
        $output.html(css_loader + buildGraphHtml);
        return;
      }
      const mostRecentVersion = versionsData[versionsData.length - 1];
      if (mostRecentVersion.visual) {
        // Graph already built, ready to be shown
        $output.html(css_loader + seeGraphHtml);
        return;
      }
      if (versionsResponse.rebuild_available) {
        // Graph non-available, but rebuild available
        $output.html(css_loader + buildGraphHtml);
        return;
      }
      // Graph non-available
      $output.html(graphNotVisual);
    }).fail(versionsResponse => {
      $output.html(css_loader + communicationErrorHtml);
    })
  }).fail(translationResponse => {
    $output.html(css_loader + communicationErrorHtml);
  });
})();
