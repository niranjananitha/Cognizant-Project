import machine1Defibrillator from './machine1_defibrillator.png';
import machine2Monitor from './machine2_monitor.png';
import machine3Ventilator from './machine3_ventilator.png';
import machine4Mri from './machine4_mri.png';
import machine5InfusionPump from './machine5_infusion_pump.png';

// New Machine Images
import machine6GeCarescape from './machine6_ge_carescape.png';
import machine7ZollLifepak from './machine7_zoll_lifepak.png';
import machine8BdAlaris from './machine8_bd_alaris.png';
import machine9GeOecCarm from './machine9_ge_oec_carm.png';
import machine10SiemensXray from './machine10_siemens_xray.png';
import machine11SonositeUltrasound from './machine11_sonosite_ultrasound.png';

export const machineImages = {
  // Category defaults
  defibrillator: machine1Defibrillator,
  monitor: machine2Monitor,
  ventilator: machine3Ventilator,
  mri: machine4Mri,
  infusionPump: machine5InfusionPump,

  // New specific image exports
  geCarescape: machine6GeCarescape,
  beneVision: machine6GeCarescape,
  zollLifepak: machine7ZollLifepak,
  bdAlaris: machine8BdAlaris,
  freseniusAgilia: machine8BdAlaris,
  geOecCarm: machine9GeOecCarm,
  siemensXray: machine10SiemensXray,
  sonositeUltrasound: machine11SonositeUltrasound,

  // Asset ID & Name Mappings
  'DEF-402-B': machine1Defibrillator,
  'BeneHeart D3 Defibrillator': machine1Defibrillator,

  'MX700-04': machine2Monitor,
  'MON-9910-A': machine2Monitor,
  'IntelliVue MX700 Monitor': machine2Monitor,

  'AST-8821-V': machine3Ventilator,
  'VEN-2023-8472': machine3Ventilator,
  'Respironics V60 Ventilator': machine3Ventilator,

  'MRI-102': machine4Mri,
  'CT-500-X': machine4Mri,
  'Siemens Magnetom 3.0T MRI': machine4Mri,

  'INF-3301-P': machine5InfusionPump,
  'Alaris System Infusion Pump': machine5InfusionPump,

  // New Machines Mapping
  'MON-B650-01': machine6GeCarescape,
  'GE Carescape B650': machine6GeCarescape,
  'MON-N15-02': machine6GeCarescape,
  'Mindray BeneVision N15': machine6GeCarescape,

  'DEF-ZOL-03': machine7ZollLifepak,
  'Zoll R Series / AED Plus': machine7ZollLifepak,
  'DEF-LP20-04': machine7ZollLifepak,
  'Physio-Control LIFEPAK 15/20e': machine7ZollLifepak,

  'INF-ALR-05': machine8BdAlaris,
  'BD Alaris System': machine8BdAlaris,
  'INF-AGI-06': machine8BdAlaris,
  'Fresenius Kabi Agilia': machine8BdAlaris,

  'IMG-CARM-07': machine9GeOecCarm,
  'GE OEC 3D C-Arm': machine9GeOecCarm,

  'IMG-XRAY-08': machine10SiemensXray,
  'Siemens Mobilett Elara Max X-ray': machine10SiemensXray,

  'IMG-US-09': machine11SonositeUltrasound,
  'Fujifilm Sonosite Ultrasound': machine11SonositeUltrasound,
};

export default machineImages;
