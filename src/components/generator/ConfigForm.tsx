'use client';
import BasicSettings from './sections/BasicSettings';
import SSLSettings from './sections/SSLSettings';
import ReverseProxy from './sections/ReverseProxy';
import Locations from './sections/Locations';
import Security from './sections/Security';
import Performance from './sections/Performance';
import Logging from './sections/Logging';
import LoadBalancing from './sections/LoadBalancing';
import PresetSelector from './PresetSelector';

export default function ConfigForm() {
    return (
        <div className="space-y-3">
            <PresetSelector />
            <div className="h-px bg-dark-700 my-4" />
            <div className="space-y-3">
                <BasicSettings />
                <SSLSettings />
                <ReverseProxy />
                <Locations />
                <Security />
                <Performance />
                <Logging />
                <LoadBalancing />
            </div>
        </div>
    );
}
