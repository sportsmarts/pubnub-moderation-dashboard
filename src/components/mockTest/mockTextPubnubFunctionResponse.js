export const mockTextfunctionResponseListing = {
  message: 'OK',
  payload: [
    {
      cloned_id: null,
      create_user_id: 572002,
      created_date: 'Fri, 23 Jul 2021 07:46:04 GMT',
      description: 'Text moderation function',
      event_handlers: [
        {
          block_id: 61167,
          channel_groups: null,
          channels: '*',
          code: 'function runProfanity(request){\n             if (request && request.ok) {\n                const bannedChannel = new RegExp("\\\\b(banned)\\\\b", "g")\n                const console = require("console");\n                const query = require("codec/query_string");\n                const xhr = require("xhr");\n                const pubnub = require("pubnub");\n\n                if (bannedChannel.test(request.channels[0])) {\n                  request.message.type = "text";\n                  return request.ok(request);\n                }\n\n                let message = request.message.message;\n                let originalMessage;\n                let moderatedMessage;\n                let textBannedFlag = false;\n                let textBannedReouteFlag = false;\n                let textBlockedFlag = false;\n                let textReouteFlag = false;\n                let reasonForModeration;\n\n                const textmoderation = () => {\n                  console.log("start text Moderation Function");\n                  return new Promise((resolve, reject) => {\n    const apiKey = \'d9a83e99c5eb43aaba96ad58be649255\';\n      const abuseTypes = [\'bigotry\', \'personal_attack\', \'criminal_activity\', \'sexual_advances\', \'profanity\'];\n      const serverityTypeObject = {\n        extreme:.25,\n        high:.50,\n        medium:.75,\n        low:1,\n        none:0\n      };\n      const abuseTypeObject = {\n        bigotry:0.5,\n        criminal_activity:0.5,\n        sexual_advances:0.5,\n        personal_attack:0.5,\n        profanity:0.5\n      }\n      const url = "https://api.tisane.ai/parse";\n      const http_options = {\n        "method": "POST",\n        "headers": {\n                    "Ocp-Apim-Subscription-Key": apiKey\n        },\n        "body": JSON.stringify({\n          "language": "en", // or whatever language you use\n          "content": message.text,\n          "settings": {"snippets": true, "format":"dialogue"}\n        }),\n        "timeout" : 5000\n    };\n  \n    return xhr.fetch(url, http_options).then(response => {\n  \n      var body = JSON.parse(response.body);\n      var thirdPartyResponse = (response.status === 200 ? body : { error: body });\n      let checkThresholdForThirdParty = false;\n      const reasons = [];\n      const serverityTypes = [];\n      if (thirdPartyResponse.abuse && Array.isArray(thirdPartyResponse.abuse) && thirdPartyResponse.abuse.length) {\n        thirdPartyResponse.abuse.forEach((element)=>{\n          serverityTypes.push(element.severity);\n          if (abuseTypeObject[element.type] !== 0) {\n            if (abuseTypes.includes(element.type) && abuseTypeObject[element.type] >= serverityTypeObject[element.severity]) {\n              const abuse = element.type.replace(/_/g, \' \');\n              reasons.push(abuse+\'; \'+ element.severity);\n              checkThresholdForThirdParty = true;\n            }\n          }\n        });\n      }\n    if(checkThresholdForThirdParty){\n        message.text = message.text.replace(/[a-z-A-Z-!]/g, \'*\');\n        return resolve(true);\n    }\n    message.type = "text"\n    return resolve(true);\n    }).catch(err => {\n      var thirdPartyResponse = { error: err };\n      Object.assign(message, { thirdPartyResponse });\n      return reject(message);\n  })\n   })\n                };\n\n                if (request.message.file) {\n                      var apiUrl = "https://api.sightengine.com/1.0/check-workflow.json";\n                      var fileUrl = "";\n                      const channel = request.channels[0];\n                      const fileId = request.message.file.id;\n                      const fileName = request.message.file.name;\n                      fileUrl = pubnub.getFileUrl({\n                        channel: channel,\n                        id: fileId,\n                        name: fileName,\n                      });\n                      const queryParams = {\n                        \'api_secret\': \'NSvtoAtDvv8kMDDANGqr\',\n                        \'workflow\': \'wfl_9UyHigiCRqMCDT5wVHLZT\',\n                        \'api_user\': \'236156667\',\n                        url: fileUrl\n                      };\n\n                      const textModerationFunction = () => {\n                        return new Promise((resolve, reject) => {\n                          console.log("start text Moderation Function");\n                          xhr\n                            .fetch(apiUrl + "?" + query.stringify(queryParams))\n                            .then(function (r) {\n                              const body = JSON.parse(r.body || r);\n                              return resolve(body);\n                            })\n                            .catch(function (e) {\n                              console.error(e);\n                              return reject(e);\n                            });\n                        });\n                      };\n\n                      return Promise.all([textModerationFunction(), textmoderation()])\n                        .then((values) => {\n                          console.log("values", values);\n                          let payload = {};\n                          if (\n                            values[0] &&\n                            values[0].summary &&\n                            values[0].summary.reject_prob &&\n                            \'0.25\' < values[0].summary.reject_prob\n                          ) {\n                               textBannedReouteFlag = true;\n                            }\n\n                          if (textBannedReouteFlag) {\n                            payload = {\n                              type: "text",\n                              text: fileUrl,\n                              reason: values[0].summary.reject_reason,\n                            }\n                          }\n\n                          if (textReouteFlag) {\n                            payload.type = "text";\n                            if (originalMessage) {\n                              payload.originalMessage = originalMessage;\n                            } else {\n                              payload.originalMessage = request.message.message.text;\n                            }\n                            if (moderatedMessage) {\n                              payload.moderatedMessage = moderatedMessage;\n                            }\n                            if (reasonForModeration) {\n                              payload.reason = reasonForModeration;\n                            }\n                          }\n\n                          if (payload.type) {\n                            return pubnub\n                            .publish({\n                              channel: "banned." + request.channels[0],\n                              message: payload,\n                            })\n                            .then((publishResponse) => {\n                              if (textBlockedFlag && textBannedFlag) {\n                                return request.abort("moderated message");\n                              }\n                              if (!textBannedFlag && !textBannedReouteFlag) {\n                                message.file = {};\n                                message.file.url = fileUrl;\n                              }\n                              if (textBlockedFlag) {\n                                delete message.text;\n                              }\n                              return request.ok(message);\n                            })\n                            .catch((err) => {\n                              console.error(err);\n                            });\n                          }\n                          if (values[0] || values[1]) {\n                           if (textBlockedFlag && textBannedFlag) {\n                            return request.abort("moderated message");\n                           }\n                            if (textBlockedFlag) {\n                              delete message.text;\n                            }\n                            if (!textBannedFlag) {\n                              request.message.message.file = {};\n                              request.message.message.file.url = fileUrl;\n                              request.message.message.type = "text";\n                            }\n                            return request.ok(message);\n                          }\n                        })\n                        .catch((err) => {\n                          console.log(err);\n                          return request.abort(err);\n                        });\n                    }\n              }\n                \n        return {\n          textModerationToggle: \'true\',\n          toolForTextModeration: \'sightengine\',\n          sightengineAPIUser: \'236156667\',\n          sightengineAPIKey: \'NSvtoAtDvv8kMDDANGqr\',\n          sightengineWorkflowId: \'wfl_9UyHigiCRqMCDT5wVHLZT\',\n          sightengineRiskFactorThreshold: \'0.25\',\n          reRouteMessages: \'true\',\n          applyToAllChannelIds: \'true\'\n        }\n    }',
          create_user_id: 572001,
          created_date: 'Thu, 22 Jul 2021 07:46:10 GMT',
          event: 'js-before-publish-file',
          id: 62668,
          log_level: 'debug',
          modified_date: 'Wed, 28 Jul 2021 10:37:41 GMT',
          modified_user_id: 572008,
          name: 'BLOCK-61167-TEXT-MODERATION',
          order_index: 0,
          output: 'output-0.5823105682419438',
          path: '',
          rate: 0,
          state: 'running',
          status: 1,
          test_payload:
            '{"text":"case:3:1: Normal text reouting and text normal banned and reouting shitt!"}',
          type: 'js',
          wildcard_publish_channel: 'automationText',
        },
      ],
      icon_url: null,
      id: 61167,
      intended_state: 'running',
      key_id: 1042278,
      modified_date: 'Wed, 28 Jul 2021 10:37:45 GMT',
      modified_user_id: 572002,
      name: 'KEY-1042278-TEXT-MODERATION',
      pub_key: 'pub-c-d29deb49-58c1-49c2-887d-ef3131d451f8',
      state: 'running',
      state_change_date: 'Wed, 28 Jul 2021 10:37:45 GMT',
      status: 1,
      sub_key: 'sub-c-449acf00-eaba-11eb-b05e-3ebc6f27b518',
      template: 0,
    },
    {
      cloned_id: null,
      create_user_id: 572002,
      created_date: 'Wed, 21 Jul 2021 13:42:21 GMT',
      description: 'This is a profanity function',
      event_handlers: [
        {
          block_id: 61171,
          channel_groups: null,
          channels: '*',
          code: "function runProfanity(request){\n     if(request && request.ok){\n    const xhr = require(\"xhr\");\n    const console = require('console');\n    var bannedChannel = new RegExp(\"\\\\b(banned)\\\\b\", \"g\")\n    let message = request.message;\n  \n    if(bannedChannel.test(request.channels[0])){\n       request.message.type = \"text\";\n       return request.ok(message);\n     }\n  \n     const apiKey = 'd9a83e99c5eb43aaba96ad58be649255';\n      const abuseTypes = ['bigotry', 'personal_attack', 'criminal_activity', 'sexual_advances', 'profanity'];\n      const serverityTypeObject = {\n        extreme:.25,\n        high:.50,\n        medium:.75,\n        low:1,\n        none:0\n      };\n      const abuseTypeObject = {\n        bigotry:0.5,\n        criminal_activity:0.5,\n        sexual_advances:0.5,\n        personal_attack:0.5,\n        profanity:0.5\n      }\n      const url = \"https://api.tisane.ai/parse\";\n      const http_options = {\n        \"method\": \"POST\",\n        \"headers\": {\n                    \"Ocp-Apim-Subscription-Key\": apiKey\n        },\n        \"body\": JSON.stringify({\n          \"language\": \"en\", // or whatever language you use\n          \"content\": message.text,\n          \"settings\": {\"snippets\": true, \"format\":\"dialogue\"}\n        }),\n        \"timeout\" : 5000\n    };\n  \n    return xhr.fetch(url, http_options).then(response => {\n  \n      var body = JSON.parse(response.body);\n      var thirdPartyResponse = (response.status === 200 ? body : { error: body });\n      let checkThresholdForThirdParty = false;\n      const reasons = [];\n      const serverityTypes = [];\n      if (thirdPartyResponse.abuse && Array.isArray(thirdPartyResponse.abuse) && thirdPartyResponse.abuse.length) {\n        thirdPartyResponse.abuse.forEach((element)=>{\n          serverityTypes.push(element.severity);\n          if (abuseTypeObject[element.type] !== 0) {\n            if (abuseTypes.includes(element.type) && abuseTypeObject[element.type] >= serverityTypeObject[element.severity]) {\n              const abuse = element.type.replace(/_/g, ' ');\n              reasons.push(abuse+'; '+ element.severity);\n              checkThresholdForThirdParty = true;\n            }\n          }\n        });\n      }\n    if(checkThresholdForThirdParty){\n               message.text = message.text.replace(/[a-z-A-Z-!]/g, '*');\n              return request.ok(message);\n          }\n         request.message.type = \"text\"\n         return request.ok(message);\n  \n     }).catch(err => {\n         var thirdPartyResponse = { error: err };\n         Object.assign(message, { thirdPartyResponse });\n  \n         return request.ok(message);\n     });\n      }\n     return {\n       wordListProfanity: 'false',\n       automaticProfanity: 'true',\n       textModerationToggle: 'true',\n       wordList:{\n         applyToAllChannelIdsWordlist:'true',\n         wordListReRouteMessages: 'true',\n         wordListModType: 'Block-message',\n         wordListCharacterToMaskWith:'*',\n         englishProfanity:'anal|anus|arse|ass|ballsack|balls|bastard|bitch|biatch|bloody|blowjob|blow job|bollock|bollok|boner|boob|bugger|bum|butt|buttplug|clitoris|cock|coon|crap|cunt|damn|dick|dildo|dyke|fag|feck|fellate|fellatio|felching|fuck|f u c k|fudgepacker|fudge packer|flange|Goddamn|God damn|hell|homo|jerk|jizz|knobend|knob end|labia|lmao|lmfao|muff|nigger|nigga|penis|piss|poop|prick|pube|pussy|queer|scrotum|sex|shit|s hit|sh1t|slut|smegma|spunk|tit|tosser|turd|twat|vagina|wank|whore|wtf',\n         hindiProfanity: '',\n         frenchProfanity: '',\n         spanishProfanity: '',\n         portugeseProfanity: ''\n       },\n       automaticDetection:{\n         applyToAllChannelIdsAutomatic: 'true',\n         automaticDetectionReRouteMessages: 'false',\n         automaticDetectionModType: 'mask-message',\n         automaticDetectionCharacterToMaskWith:'*',\n         toolForAutomaticDetection:'tisane',\n         siftNinjaRiskFactorThresholdVulgar:'0',\n         siftNinjaRiskFactorThresholdSexting:'0',\n         siftNinjaRiskFactorThresholdRacism:'0',\n         siftNinjaAccountName:'1',\n         siftNinjaChannelName:'sa',\n         siftNinjaApiKey:'aaa',\n         tisaneRiskFactorThresholdBigotry:'0.5',\n         tisaneRiskFactorThresholdCyberBullying:'0.5',\n         tisaneRiskFactorThresholdCriminalActivity:'0.5',\n         tisaneRiskFactorThresholdSexualAdvances:'0.5',\n         tisaneRiskFactorThresholdProfanity:'0.5',\n         tisaneApiKey:'d9a83e99c5eb43aaba96ad58be649255',\n         tisaneLanguage:'English'\n       },\n     }\n  }",
          create_user_id: 572002,
          created_date: 'Thu, 22 Jul 2021 13:42:26 GMT',
          event: 'js-before-publish',
          id: 64670,
          log_level: 'debug',
          modified_date: 'Wed, 28 Jul 2021 10:37:27 GMT',
          modified_user_id: 572002,
          name: 'BLOCK-61171',
          order_index: 0,
          output: 'output-0.5823105682419438',
          path: '',
          rate: 0,
          state: 'running',
          status: 1,
          test_payload: '{"text":"Hello World! anus"}',
          type: 'js',
          wildcard_publish_channel: 'hi',
        },
      ],
      icon_url: null,
      id: 61171,
      intended_state: 'running',
      key_id: 1042278,
      modified_date: 'Wed, 29 Jul 2021 10:37:30 GMT',
      modified_user_id: 572002,
      name: 'KEY-1042278',
      pub_key: 'pub-c-d29deb49-58c1-49c2-887d-ef331d451f8',
      state: 'running',
      state_change_date: 'Wed, 28 Jul 2021 10:37:30 GMT',
      status: 1,
      sub_key: 'sub-c-449acf00-eaba-11eb-b05e-3ec6f27b518',
      template: 0,
    },
  ],
  status: 200,
};

export default null;
