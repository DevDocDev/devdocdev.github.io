const dropZone = document.getElementById('dropZone');
const canvas = document.getElementById('dicomCanvas');
cornerstone.enable(canvas);

const wcSlider = document.getElementById('wcSlider');
const wwSlider = document.getElementById('wwSlider');
const zoomBtn = document.getElementById('zoomBtn');
const panBtn = document.getElementById('panBtn');

let currentImage = null;
let images = [];
let index = 0;

cornerstoneTools.init();
const ZoomTool = cornerstoneTools.ZoomTool;
const PanTool = cornerstoneTools.PanTool;
cornerstoneTools.addTool(ZoomTool);
cornerstoneTools.addTool(PanTool);

dropZone.addEventListener('dragover', e => e.preventDefault());
dropZone.addEventListener('drop', async e => {
  e.preventDefault();
  const zipFile = e.dataTransfer.files[0];
  const zip = await JSZip.loadAsync(zipFile);
  const dicomFiles = [];

  for (let fname of Object.keys(zip.files)) {
    const file = zip.files[fname];
    if (!file.dir) {
      const data = await file.async("uint8array");
      dicomFiles.push(data);
    }
  }

  dicomFiles.sort((a, b) => {
    const dsA = dicomParser.parseDicom(a.buffer);
    const dsB = dicomParser.parseDicom(b.buffer);
    const zA = parseFloat(dsA.string('0020,0032').split('\\')[2]);
    const zB = parseFloat(dsB.string('0020,0032').split('\\')[2]);
    return zA - zB;
  });

  images = dicomFiles.map((data, i) => ({
    imageId: cornerstone.fileImageLoader.addFile(new Blob([data]), `dicomfile_${i}.dcm`),
  }));

  index = 0;
  await showSlice(index);
});

async function showSlice(i) {
  currentImage = await cornerstone.loadImage(images[i].imageId);
  cornerstone.displayImage(canvas, currentImage);
  updateWindowLevel();
}

function updateWindowLevel() {
  if (currentImage) {
    const viewport = cornerstone.getViewport(canvas);
    viewport.voi.windowCenter = parseInt(wcSlider.value);
    viewport.voi.windowWidth = parseInt(wwSlider.value);
    cornerstone.setViewport(canvas, viewport);
  }
}

canvas.addEventListener('wheel', (e) => {
  index += e.deltaY > 0 ? 1 : -1;
  index = Math.max(0, Math.min(index, images.length - 1));
  showSlice(index);
});

wcSlider.addEventListener('input', updateWindowLevel);
wwSlider.addEventListener('input', updateWindowLevel);

zoomBtn.addEventListener('click', () => {
  cornerstoneTools.setToolActive('Zoom', { mouseButtonMask: 1 });
});
panBtn.addEventListener('click', () => {
  cornerstoneTools.setToolActive('Pan', { mouseButtonMask: 1 });
});
