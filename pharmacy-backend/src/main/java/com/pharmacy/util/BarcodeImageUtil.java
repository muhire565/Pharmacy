package com.pharmacy.util;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.oned.Code128Writer;
import lombok.experimental.UtilityClass;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Base64;
import java.util.EnumMap;
import java.util.Map;

@UtilityClass
public class BarcodeImageUtil {

    private static final int WIDTH = 320;
    private static final int HEIGHT = 120;
    private static final int QR_SIZE = 256;

    public String code128PngBase64(String text) throws WriterException, IOException {
        Map<EncodeHintType, Object> hints = new EnumMap<>(EncodeHintType.class);
        hints.put(EncodeHintType.MARGIN, 1);
        BitMatrix matrix = new Code128Writer().encode(text, BarcodeFormat.CODE_128, WIDTH, HEIGHT, hints);
        BufferedImage image = MatrixToImageWriter.toBufferedImage(matrix);
        return toPngBase64(image);
    }

    public String qrPngBase64(String text) throws WriterException, IOException {
        Map<EncodeHintType, Object> hints = new EnumMap<>(EncodeHintType.class);
        hints.put(EncodeHintType.MARGIN, 1);
        BitMatrix matrix = new QRCodeWriter().encode(text, BarcodeFormat.QR_CODE, QR_SIZE, QR_SIZE, hints);
        BufferedImage image = MatrixToImageWriter.toBufferedImage(matrix);
        return toPngBase64(image);
    }

    private String toPngBase64(BufferedImage image) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(image, "PNG", baos);
        return Base64.getEncoder().encodeToString(baos.toByteArray());
    }
}
