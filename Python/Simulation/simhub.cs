// MainWindow.xaml
<Window x:Class="SimHubDashboard.MainWindow"
        xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="SimHub Dashboard" Height="350" Width="525">
    <Grid>
        <StackPanel>
            <TextBlock Text="SimHub Dashboard" FontSize="20" HorizontalAlignment="Center" Margin="0,0,0,20"/>
            
            <TextBlock Text="Speed:" Margin="0,0,0,5"/>
            <ProgressBar Name="SpeedProgressBar" Maximum="100" Value="50" Margin="0,0,0,10"/>
            
            <TextBlock Text="RPM:" Margin="0,0,0,5"/>
            <ProgressBar Name="RpmProgressBar" Maximum="8000" Value="4000" Margin="0,0,0,10"/>
            
            <Button Content="Start" Click="StartButton_Click" Width="100" Height="30" HorizontalAlignment="Center"/>
        </StackPanel>
    </Grid>
</Window>

// MainWindow.xaml.cs
using System;
using System.Threading;
using System.Windows;

namespace SimHubDashboard
{
    public partial class MainWindow : Window
    {
        private bool isSimulationRunning = false;
        private Random random = new Random();

        public MainWindow()
        {
            InitializeComponent();
        }

        private void StartButton_Click(object sender, RoutedEventArgs e)
        {
            if (isSimulationRunning)
            {
                isSimulationRunning = false;
            }
            else
            {
                isSimulationRunning = true;
                SimulateData();
            }
        }

        private void SimulateData()
        {
            new Thread(() =>
            {
                while (isSimulationRunning)
                {
                    Dispatcher.Invoke(() =>
                    {
                        // Simulated speed and RPM values
                        int speed = random.Next(0, 100);
                        int rpm = random.Next(0, 8000);

                        // Update UI elements
                        SpeedProgressBar.Value = speed;
                        RpmProgressBar.Value = rpm;
                    });

                    Thread.Sleep(1000); // Simulate a delay (1 second) between updates
                }
            }).Start();
        }
    }
}

// App.xaml
<Application x:Class="SimHubDashboard.App"
             xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
             xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
             StartupUri="MainWindow.xaml">
    <Application.Resources>

    </Application.Resources>
</Application>
