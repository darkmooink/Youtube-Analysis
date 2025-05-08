import openAIModeration from "./openAIModeration"
import {sleep} from '../utils/async'
import {summery, getUserDetails, getNewVideos, needMoreData, getVideoDetails} from "./userGetting"
  
  async function run() {
    // await sleep(100*1000);
    while (true) {
      // TODO: Put your real background task here
      console.log('Background running...');
      if (await needMoreData()){
        await getUserDetails()

        await getNewVideos()
      }
        await getVideoDetails()
      
      await openAIModeration.allComments(-1)
      await sleep(10*1000); 
    }
  }

  
  function start() {
    summery()
    // getNewVideos()
    run();
  }
  
  export { start };