#version 310 es

#extension GL_GOOGLE_include_directive : enable

#include "constants.h"

layout(input_attachment_index = 0, set = 0, binding = 0) uniform highp subpassInput in_color;

layout(set = 0, binding = 1) uniform sampler2D color_grading_lut_texture_sampler;

layout(location = 0) out highp vec4 out_color;

void main()
{
    highp ivec2 lut_tex_size = textureSize(color_grading_lut_texture_sampler, 0);

    highp float width      = float(lut_tex_size.x);
    highp float height     = float(lut_tex_size.y);
    highp float colors     = width / height;
    highp float colors_max     = colors - 1.0;

    highp vec4 color       = subpassLoad(in_color).rgba;

    //通过蓝色通道获取对应色块的索引值，包含高低两个色块
    highp float index = color.b * colors_max;
    highp float index_l = floor(index);
    highp float index_h = ceil(index);

    //获取半像素的偏移量，以便从像素中心读取
    highp float half_px_x = 0.5 / width;
    highp float half_px_y = 0.5 / height;

    //根据红色通道和绿色通道分别计算其在纹理上的偏移量
    highp float offset_x = half_px_x + color.r / colors * (colors_max / colors);
    highp float offset_y = half_px_y + color.g * (colors_max / colors);

    //计算两个色块对应的uv
    highp vec2 lut_pos_l = vec2(index_l / colors + offset_x, offset_y);
    highp vec2 lut_pos_h = vec2(index_h / colors + offset_x, offset_y);

    //获取两个色块对应的颜色
    highp vec4 color_l = texture(color_grading_lut_texture_sampler, lut_pos_l);
    highp vec4 color_h = texture(color_grading_lut_texture_sampler, lut_pos_h);

    //将两个颜色按照索引位置进行线性插值
    color = mix(color_l, color_h, fract(index));

    out_color = color;
}
