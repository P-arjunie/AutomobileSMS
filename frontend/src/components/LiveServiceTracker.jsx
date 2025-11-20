import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getServiceStatus, getServiceTimeline } from '../utils/serviceStatusApi';
import socket from '../utils/socket';

const LiveServiceTracker = () => {
  const { id } = useParams();
//   const { user } = useContext(AuthContext);
  const [service, setService] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServiceData = async () => {
      try {
        const serviceRes = await getServiceStatus(id);
        setService(serviceRes.data);
        const timelineRes = await getServiceTimeline(id);
        setTimeline(timelineRes.data);
      } catch (error) {
        console.error('Error fetching service data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchServiceData();

    socket.emit('join-service', id);

    socket.on('service.status.updated', (data) => {
      setService(data.service);
      setTimeline(prevTimeline => [data.statusHistory, ...prevTimeline]);
    });

    socket.on('service.note.added', (data) => {
      setTimeline(prevTimeline => [data, ...prevTimeline]);
    });

    return () => {
      socket.off('service.status.updated');
      socket.off('service.note.added');
    };
  }, [id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!service) {
    return <div>Service not found.</div>;
  }

  const statuses = ['Checked In', 'Diagnosis', 'In Progress', 'Quality Check', 'Completed'];
  const currentStatusIndex = statuses.indexOf(service.current_status);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Live Service Tracker</h1>
      <div className="mb-4">
        <h2 className="text-xl">Service Status: {service.current_status}</h2>
        {service.estimated_completion && (
          <p>Estimated Completion: {new Date(service.estimated_completion).toLocaleString()}</p>
        )}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
        <div
          className="bg-blue-600 h-4 rounded-full"
          style={{ width: `${((currentStatusIndex + 1) / statuses.length) * 100}%` }}
        ></div>
      </div>
      <div>
        <h3 className="text-lg font-semibold">Service Timeline</h3>
        <ul>
          {timeline.map((item) => (
            <li key={item._id} className="mb-2 p-2 border-b">
              <p><strong>{item.status}</strong> - {new Date(item.timestamp).toLocaleString()}</p>
              {item.notes && <p>Notes: {item.notes}</p>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default LiveServiceTracker;
