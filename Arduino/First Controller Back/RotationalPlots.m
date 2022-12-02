clc; close all; clear all; 

data = readmatrix ('RotationalData.txt');

trimStart = 435;
trimEnd = 624;

timeData = data(trimStart:trimEnd,2);
rotationData = data(trimStart:trimEnd,1);

timeData = timeData - timeData(1)

timeData = (timeData)/1000;


perfect_time = 0:.01:1;

%CREATING THE TRANSFER FUNCTION THAT DESCRIBES ROTATIONAL VELOCITY OF ZUMO
s = tf('s');

A = 2145;
a = 14.3;

P = A/(s+a); 

[ysim, tsim] = step(P,perfect_time);

ysim = ysim * (5*.5); %Full input = 5... PMW for this data was 100... 100 is 1/4 of 400... So step is 1/4 of the full voltage... = .25*5






figure(1)
plot (tsim,ysim)
hold on
plot(timeData,rotationData)
xlabel('Time, s')
ylabel('Rotational Vel')
