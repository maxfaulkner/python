import irsdk
ir = irsdk.IRSDK()
ir.startup()
while True:
    print(ir['Speed'] * 2.23694)  