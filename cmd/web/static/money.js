
    // 元素
    const portraitArea = document.getElementById('portraitArea');
    const portrait = document.getElementById('portrait');
    const fileInput = document.getElementById('fileInput');
    const replaceBtn = document.getElementById('replaceBtn');
    const resetBtn = document.getElementById('resetBtn');
    const exportBtn = document.getElementById('exportBtn');

    let currentImage = null; // HTMLImageElement
    // 随机生成序列号
    let serialNumber = "S/N: JZ-" + Date.now() + "-" + Math.floor(Math.random() * 10000);
    document.getElementById('serialText').textContent = serialNumber;

    // 点击 portrait 或按钮 弹出文件选择
    function openFilePicker() { fileInput.click(); }
    portraitArea.addEventListener('click', openFilePicker);
    replaceBtn.addEventListener('click', openFilePicker);

    // 文件选择处理
    fileInput.addEventListener('change', (ev) => {
      const file = ev.target.files && ev.target.files[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) { alert('请选择图片文件'); return; }
      const url = URL.createObjectURL(file);
      setPortraitImage(url);
      // 释放 objectURL 在图片加载完成后
    });

    // 支持拖拽到头像区
    ;['dragenter', 'dragover'].forEach(evt => portraitArea.addEventListener(evt, e => { e.preventDefault(); portraitArea.style.outline = '3px dashed rgba(12,107,134,0.25)'; }));
    ;['dragleave', 'drop'].forEach(evt => portraitArea.addEventListener(evt, e => { e.preventDefault(); portraitArea.style.outline = 'none'; }));
    portraitArea.addEventListener('drop', e => {
      const dt = e.dataTransfer;
      if (!dt) return;
      const file = dt.files && dt.files[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) { alert('请拖入图片文件'); return; }
      const url = URL.createObjectURL(file);
      setPortraitImage(url);
    });

    // 将图片展示到 .portrait 中
    function setPortraitImage(src) {
      // 清除占位符
      const ph = portrait.querySelector('.placeholder');
      if (ph) ph.style.display = 'none';

      // 如果已有 img，替换 src；否则创建
      let img = portrait.querySelector('img');
      if (!img) {
        img = document.createElement('img');
        portrait.appendChild(img);
      }
      img.src = src;
      currentImage = img;

      // 当图片加载完成后释放 object URL（如果有）
      img.onload = () => {
        try { if (src.startsWith('blob:')) URL.revokeObjectURL(src); } catch (e) { }
        img.dataset.ow = img.naturalWidth;
        img.dataset.oh = img.naturalHeight;
      }
    }

    // 重置
    resetBtn.addEventListener('click', () => {
      const img = portrait.querySelector('img');
      if (img) img.remove();
      const ph = portrait.querySelector('.placeholder');
      if (ph) ph.style.display = '';
      currentImage = null;
      fileInput.value = '';
    });

    // 导出为 PNG（使用 Canvas 手动绘制）
    exportBtn.addEventListener('click', async () => {
      // canvas 大小按当前 banknote DOM 宽高计算，放大 2x 以便清晰
      const banknote = document.querySelector('.banknote');
      const rect = banknote.getBoundingClientRect();
      const scale = 2; // 导出放大倍数
      const cw = Math.round(rect.width * scale);
      const ch = Math.round(rect.height * scale);

      const canvas = document.createElement('canvas');
      canvas.width = cw; canvas.height = ch;
      const ctx = canvas.getContext('2d');

      // 绘制背景（与 CSS 近似）
      // 底色
      const grad = ctx.createLinearGradient(0, 0, cw, 0);
      grad.addColorStop(0, '#f6e7c8');
      grad.addColorStop(0.3, '#f5e2b8');
      grad.addColorStop(1, '#f6e7c8');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, cw, ch);

      // 左侧纹理
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.translate(cw * 0.08, ch * 0.06);
      ctx.transform(1, 0, -0.2, 1, 0, 0);
      ctx.fillStyle = '#000000';
      for (let y = 0; y < ch; y += 10) { ctx.fillRect(0, y, cw * 0.12, 2); }
      ctx.restore();

      // 票面文字
      ctx.fillStyle = '#2d3b3f';
      ctx.font = `${Math.round(44 * scale)}px serif`;
      ctx.textBaseline = 'top';
      ctx.fillText('$100,000,000,000', Math.round(40 * scale), Math.round(36 * scale));

      ctx.font = `${Math.round(16 * scale)}px sans-serif`;
      ctx.fillText('京巴布韦企业集团', Math.round(40 * scale), Math.round(36 * scale + 54 * scale));

      ctx.font = `${Math.round(12 * scale)}px monospace`;
      ctx.fillText(serialNumber, cw - Math.round(220 * scale), Math.round(36 * scale));

      // 画头像：根据 portrait DOM 的位置绘制
      const portraitDom = document.getElementById('portrait');
      const portraitRect = portraitDom.getBoundingClientRect();
      // 计算相对于 banknote 的偏移
      const bankRect = banknote.getBoundingClientRect();
      const px = Math.round((portraitRect.left - bankRect.left) * scale);
      const py = Math.round((portraitRect.top - bankRect.top) * scale);
      const pw = Math.round(portraitRect.width * scale);
      const phh = Math.round(portraitRect.height * scale);

      // 绘制头像背景圆（白边）
      ctx.save();
      const border = Math.round(8 * scale);
      ctx.beginPath();
      ctx.arc(px + pw / 2, py + phh / 2, Math.min(pw, phh) / 2 + border / 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fill();
      ctx.restore();

      // 如果有图片，直接使用 currentImage 绘制裁切为圆形
      if (currentImage && currentImage.src) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(px + pw / 2, py + phh / 2, Math.min(pw, phh) / 2, 0, Math.PI * 2);
        ctx.clip();

        let sw = currentImage.naturalWidth;
        let sh = currentImage.naturalHeight;
        if (currentImage.dataset.ow && currentImage.dataset.oh) {
          sw = parseInt(currentImage.dataset.ow);
          sh = parseInt(currentImage.dataset.oh);
        }
        const ratio = Math.max(pw / sw, phh / sh);
        const dw = sw * ratio;
        const dh = sh * ratio;
        const dx = px + (pw - dw) / 2;
        const dy = py + (phh - dh) / 2;

        ctx.drawImage(currentImage, dx, dy, dw, dh);
        ctx.restore();
      } else {
        // 占位文字
        ctx.fillStyle = '#13506a';
        ctx.font = `${Math.round(12 * scale)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('点击或拖拽图片到此处', px + pw / 2, py + phh / 2 - 8 * scale);
      }

      // 生成下载链接
      const dataURL = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataURL; a.download = 'money.png';
      a.click();
    });

    // Helper: draw image into canvas clipped as circle and cover-fit
    function drawImageInCircle(ctx, src, x, y, w, h, opts = {}) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          ctx.save();
          ctx.beginPath();
          ctx.arc(x + w / 2, y + h / 2, Math.min(w, h) / 2, 0, Math.PI * 2);
          ctx.clip();

          let sx = 0, sy = 0, sw = img.width, sh = img.height;
          if (opts.sx !== undefined) {
            sx = opts.sx; sy = opts.sy; sw = opts.sw; sh = opts.sh;
          }

          const ratio = Math.max(w / sw, h / sh);
          const dw = sw * ratio;
          const dh = sh * ratio;
          const dx = x + (w - dw) / 2;
          const dy = y + (h - dh) / 2;

          ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
          ctx.restore();
          resolve();
        };
        img.onerror = (e) => { console.error('image load error', e); resolve(); };
        img.src = src;
      });
    }

    // 可选：键盘可访问性（按 Enter 打开文件选择）
    portraitArea.tabIndex = 0;
    portraitArea.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') openFilePicker(); });


    (function() {
      var lang = "zh";
      if (navigator.languages && navigator.languages.length) {
        lang = navigator.languages[0].toLowerCase();
      } else if (navigator.language) {
        lang = navigator.language.toLowerCase();
      } else if (navigator.userLanguage) {
        lang = navigator.userLanguage.toLowerCase();
      }
      if (/en/i.test(navigator.userAgent)) {
        lang = "en";
      }
      lang = lang.startsWith("zh") ? "zh" : "en";
      // lang="en"
      var translations = {
        zh: {
          title: "以“京巴布韦”最大面值纸币为灵感",
          subtitle: "点击头像更换为你的图片（支持拖拽选择）。",
          company: "京巴布韦企业集团",
          desc: "广场轮渡水黄色，吃喝玩乐去广州",
          hint: "不要上传活人的头像",
          replace: "换人",
          reset: "重置",
          export: "导出假币",
          footer: "提示：替换后的头像仅在本地浏览器显示，不会上传到服务器。",
          placeholder: "点击或拖拽图片到此处"
        },
        en: {
          title: "Inspired by the largest denomination banknote of 'Jingbabuwei'",
          subtitle: "Click the avatar to replace it with your image (drag & drop supported).",
          company: "Jingbabuwei Enterprise Group",
          desc: "Yellow water at the Shantou ferry, have fun and eat in Guangzhou",
          hint: "Do not upload photos of living people",
          replace: "Replace",
          reset: "Reset",
          export: "Export",
          footer: "Note: The replaced avatar is only displayed in your browser and will not be uploaded to the server.",
          placeholder: "Click or drag an image here"
        }
      };
      var dict = translations[lang] || translations["zh"];
      document.querySelectorAll("[data-i18n]").forEach(function(el) {
        var key = el.getAttribute("data-i18n");
        if(dict[key]) el.textContent = dict[key];
      });
    })();