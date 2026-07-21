import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
// Dev box has ~7.7GB RAM (~4.4GB available under load). Full-sequence exports
// with many concurrent <Video> elements (archival clip scenes) hit a 28s
// delayRender() timeout under default concurrency — every scene rendered fine
// individually in the smoke pass, only the concurrent full render stalled.
// Lower concurrency + a longer timeout trade render speed for reliability on
// this host instead of masking the failure with a blind retry.
Config.setConcurrency(2);
Config.setDelayRenderTimeoutInMilliseconds(90000);
